package outbound

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

func TestDNSRecoveryPreservesWorkingSystemResolution(t *testing.T) {
	r := &dnsRecovery{
		system: func(context.Context, string, string) ([]net.IP, error) { return []net.IP{net.ParseIP("8.8.8.8")}, nil },
		public: func(context.Context, string) ([]net.IP, time.Duration, error) {
			t.Fatal("fallback called despite native success")
			return nil, 0, nil
		},
	}
	ips, err := r.lookup(context.Background(), "api.example.com", true)
	if err != nil || len(ips) != 1 || ips[0].String() != "8.8.8.8" {
		t.Fatalf("lookup = %v, %v", ips, err)
	}
}

func TestDNSRecoveryUsesBoundedCacheWithoutMutatingAddresses(t *testing.T) {
	calls := 0
	r := &dnsRecovery{
		system: func(context.Context, string, string) ([]net.IP, error) { return nil, errors.New("no such host") },
		public: func(context.Context, string) ([]net.IP, time.Duration, error) {
			calls++
			return []net.IP{net.ParseIP("8.8.8.8")}, 5 * time.Minute, nil
		},
	}
	ips, err := r.lookup(context.Background(), "api.example.com", true)
	if err != nil {
		t.Fatal(err)
	}
	ips[0][0] = 99
	ips, err = r.lookup(context.Background(), "api.example.com", true)
	if err != nil || calls != 1 || ips[0].String() != "8.8.8.8" {
		t.Fatalf("cached = %v, %v, calls=%d", ips, err, calls)
	}
	if time.Until(r.cache["api.example.com"].expires) > time.Minute {
		t.Fatal("cache outlives one minute")
	}
}

func TestDNSRecoveryDoesNotSendPrivateOrInvalidNamesToPublicResolvers(t *testing.T) {
	r := &dnsRecovery{
		system: func(context.Context, string, string) ([]net.IP, error) { return nil, errors.New("no such host") },
		public: func(context.Context, string) ([]net.IP, time.Duration, error) {
			t.Fatal("private/invalid name leaked to public DNS")
			return nil, 0, nil
		},
	}
	for _, host := range []string{"localhost", "server", "printer.local", "gateway.internal", "home.lan", "router.home.arpa", "127.0.0.1", "bad..com", "-bad.com", "bad.com\n"} {
		if _, err := r.lookup(context.Background(), host, true); err == nil {
			t.Fatalf("expected native failure for %q", host)
		}
	}
	if _, err := r.lookup(context.Background(), "trusted.public.com", false); err == nil {
		t.Fatal("private host override should stay with native DNS")
	}
}

func TestDNSRecoveryDoesNotRunAfterContextCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	r := &dnsRecovery{system: func(context.Context, string, string) ([]net.IP, error) {
		t.Fatal("lookup after cancellation")
		return nil, nil
	}}
	if _, err := r.lookup(ctx, "api.example.com", true); !errors.Is(err, context.Canceled) {
		t.Fatal(err)
	}
}

func TestDNSFallbackRetainsPrivateAndReservedAddressGuards(t *testing.T) {
	t.Setenv("CANVAS_ALLOW_PRIVATE_UPSTREAMS", "false")
	t.Setenv("CANVAS_ALLOWED_PRIVATE_UPSTREAM_HOSTS", "")
	t.Setenv("CANVAS_DNS_HTTPS_FALLBACK", "1")
	prior := publicDNSRecovery
	t.Cleanup(func() { publicDNSRecovery = prior })
	for _, address := range []string{"127.0.0.1", "169.254.169.254", "192.168.0.1", "100.100.100.200", "2001:db8::1"} {
		r := &dnsRecovery{
			system: func(context.Context, string, string) ([]net.IP, error) { return nil, errors.New("no such host") },
			public: func(context.Context, string) ([]net.IP, time.Duration, error) {
				return []net.IP{net.ParseIP("8.8.8.8"), net.ParseIP(address)}, time.Minute, nil
			},
		}
		publicDNSRecovery = r
		if _, err := resolveCustomRelayHost(context.Background(), "api.example.com"); err == nil {
			t.Fatalf("accepted mixed unsafe answer %s", address)
		}
		if len(r.cache) != 0 {
			t.Fatalf("cached unsafe answer %s", address)
		}
	}
}

func TestHTTPSDNSQueryValidatesQuestionAddressesAndResponseBounds(t *testing.T) {
	for _, body := range []string{
		`{"Status":0,"Question":[{"name":"api.example.com.","type":1}],"Answer":[{"type":1,"TTL":300,"data":"8.8.8.8"}]}`,
		`{"Status":0,"Question":[{"name":"other.example.com.","type":1}],"Answer":[{"type":1,"TTL":300,"data":"8.8.8.8"}]}`,
		`{"Status":0,"Question":[{"name":"api.example.com.","type":1}],"Answer":[{"type":1,"TTL":300,"data":"::1"}]}`,
		`{"Status":3,"Question":[{"name":"api.example.com.","type":1}]}`,
		`{"Status":0,"TC":true,"Question":[{"name":"api.example.com.","type":1}]}`,
	} {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Header.Get("Accept") != "application/dns-json" || r.URL.Query().Get("name") != "api.example.com" {
				t.Error("incorrect DNS-only request")
			}
			io.WriteString(w, body)
		}))
		p := httpsDNSProvider{endpoint: server.URL, client: server.Client()}
		ips, ttl, err := p.query(context.Background(), "api.example.com", 1)
		server.Close()
		if body == `{"Status":0,"Question":[{"name":"api.example.com.","type":1}],"Answer":[{"type":1,"TTL":300,"data":"8.8.8.8"}]}` {
			if err != nil || len(ips) != 1 || ttl != time.Minute {
				t.Fatalf("valid response = %v,%v,%v", ips, ttl, err)
			}
		} else if err == nil {
			t.Fatal("invalid response accepted")
		}
	}
}

func TestHTTPSDNSProvidersKeepTLSAndRedirectChecks(t *testing.T) {
	for _, p := range httpsDNSProviders {
		transport := p.client.Transport.(*http.Transport)
		if transport.TLSClientConfig != nil && transport.TLSClientConfig.InsecureSkipVerify {
			t.Fatal("TLS verification disabled")
		}
		if p.client.CheckRedirect == nil {
			t.Fatal("redirect guard missing")
		}
		if _, err := transport.DialContext(context.Background(), "tcp", "unrelated.example.com:443"); err == nil {
			t.Fatal("DNS bootstrap accepted unrelated destination")
		}
	}
}

// Opt-in live diagnostic only: two public DNS reads and one public Axon status
// GET. It never logs in or calls a generation endpoint.
func TestLiveDNSFallback(t *testing.T) {
	if os.Getenv("CANVAS_RUN_DNS_DIAGNOSTIC") != "1" {
		t.Skip("explicit live diagnostic only")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	ips, err := lookupOutboundIPs(ctx, "zh.heihan.dpdns.org", true)
	if err != nil || len(ips) == 0 {
		for _, provider := range httpsDNSProviders {
			_, _, diagnosticErr := provider.query(context.Background(), "zh.heihan.dpdns.org", 1)
			t.Logf("resolver %s error: %v", provider.endpoint, diagnosticErr)
		}
		t.Fatalf("lookup = %v, %v", ips, err)
	}
	t.Logf("resolved Axon addresses: %v", ips)
	response, err := OutboundHTTPClient(15 * time.Second).Get("https://zh.heihan.dpdns.org/api/status")
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		t.Fatalf("status HTTP %d", response.StatusCode)
	}
	var result struct {
		Success bool `json:"success"`
		Data    struct {
			Name string `json:"system_name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, 100000)).Decode(&result); err != nil {
		t.Fatal(err)
	}
	if !result.Success || result.Data.Name != "Axon" {
		t.Fatal("response is not the actual Axon status")
	}
	t.Log("actual Axon HTTPS status verified; no generation request sent")
}
