package outbound

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

// Only name resolution is retried. This never retries a model HTTP request.
// Private/single-label names stay with the system resolver. Every returned IP
// still goes through the existing outbound/private-address policy and TLS.
var publicDNSRecovery = &dnsRecovery{
	system: net.DefaultResolver.LookupIP,
	public: queryPublicDNS,
	cache:  make(map[string]dnsCacheEntry),
}

type dnsCacheEntry struct {
	ips     []net.IP
	expires time.Time
}

type dnsRecovery struct {
	system func(context.Context, string, string) ([]net.IP, error)
	public func(context.Context, string) ([]net.IP, time.Duration, error)
	mu     sync.Mutex
	cache  map[string]dnsCacheEntry
}

func lookupOutboundIPs(ctx context.Context, host string, allowFallback bool) ([]net.IP, error) {
	allowFallback = allowFallback && os.Getenv("CANVAS_DNS_HTTPS_FALLBACK") != "0"
	return publicDNSRecovery.lookup(ctx, host, allowFallback)
}

func (r *dnsRecovery) lookup(ctx context.Context, host string, allowFallback bool) ([]net.IP, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	eligible := allowFallback && publicDNSHostname(host)
	if eligible {
		r.mu.Lock()
		entry, ok := r.cache[host]
		if ok && time.Now().Before(entry.expires) {
			ips := cloneIPs(entry.ips)
			r.mu.Unlock()
			return ips, nil
		}
		delete(r.cache, host)
		r.mu.Unlock()
	}
	nativeCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	ips, nativeErr := r.system(nativeCtx, "ip", host)
	cancel()
	if nativeErr == nil && len(ips) > 0 {
		return ips, nil
	}
	if nativeErr == nil {
		nativeErr = errors.New("system DNS returned no addresses")
	}
	if !eligible || ctx.Err() != nil {
		return nil, nativeErr
	}
	lookupCtx, cancel := context.WithTimeout(ctx, 7*time.Second)
	defer cancel()
	ips, ttl, err := r.public(lookupCtx, host)
	if err != nil || len(ips) == 0 {
		return nil, fmt.Errorf("system DNS and HTTPS DNS failed: %w", nativeErr)
	}
	// Never cache a private/reserved or mixed answer. The caller also applies
	// its policy, including stricter custom-relay rules, to every address.
	cacheable := true
	for _, ip := range ips {
		if blockedCustomRelayIP(ip) {
			cacheable = false
		}
	}
	if cacheable && ttl > 0 {
		if ttl > time.Minute {
			ttl = time.Minute
		}
		r.mu.Lock()
		if r.cache == nil {
			r.cache = make(map[string]dnsCacheEntry)
		}
		if len(r.cache) >= 256 {
			for name, entry := range r.cache {
				if !time.Now().Before(entry.expires) {
					delete(r.cache, name)
				}
			}
			if len(r.cache) >= 256 {
				for name := range r.cache {
					delete(r.cache, name)
					break
				}
			}
		}
		r.cache[host] = dnsCacheEntry{ips: cloneIPs(ips), expires: time.Now().Add(ttl)}
		r.mu.Unlock()
	}
	return ips, nil
}

func cloneIPs(ips []net.IP) []net.IP {
	result := make([]net.IP, len(ips))
	for i, ip := range ips {
		result[i] = append(net.IP(nil), ip...)
	}
	return result
}

func publicDNSHostname(host string) bool {
	if len(host) > 253 || !strings.Contains(host, ".") || net.ParseIP(host) != nil {
		return false
	}
	for _, suffix := range []string{".localhost", ".local", ".lan", ".internal", ".home.arpa", ".corp", ".test", ".invalid", ".example"} {
		if strings.HasSuffix(host, suffix) {
			return false
		}
	}
	for _, label := range strings.Split(host, ".") {
		if len(label) == 0 || len(label) > 63 || label[0] == '-' || label[len(label)-1] == '-' {
			return false
		}
		for _, ch := range label {
			if !(ch >= 'a' && ch <= 'z' || ch >= '0' && ch <= '9' || ch == '-') {
				return false
			}
		}
	}
	return true
}

type dnsJSONResponse struct {
	Status    int  `json:"Status"`
	Truncated bool `json:"TC"`
	Question  []struct {
		Name string `json:"name"`
		Type int    `json:"type"`
	} `json:"Question"`
	Answer []struct {
		Type int    `json:"type"`
		TTL  uint32 `json:"TTL"`
		Data string `json:"data"`
	} `json:"Answer"`
}

type httpsDNSProvider struct {
	endpoint string
	client   *http.Client
}

func newHTTPSDNSProvider(endpoint, bootstrapIP string) httpsDNSProvider {
	u, _ := url.Parse(endpoint)
	dialer := &net.Dialer{Timeout: 3 * time.Second, KeepAlive: 30 * time.Second}
	transport := &http.Transport{
		Proxy: outboundProxyFromEnvironment,
		DialContext: func(ctx context.Context, network, address string) (net.Conn, error) {
			host, port, err := net.SplitHostPort(address)
			if err != nil {
				return nil, err
			}
			if configuredProxyHost(host) {
				return dialer.DialContext(ctx, network, address)
			}
			if host != u.Hostname() || port != "443" {
				return nil, errors.New("unexpected DNS resolver destination")
			}
			// Prefer the normal route for these two resolver hosts (including
			// deployment DNS/VPN routing). Bootstrap only if that route fails.
			if connection, dialErr := dialer.DialContext(ctx, network, address); dialErr == nil {
				return connection, nil
			} else if bootstrapIP == "" {
				return nil, dialErr
			}
			// HTTPS always authenticates the original resolver hostname.
			return dialer.DialContext(ctx, "tcp", net.JoinHostPort(bootstrapIP, port))
		},
		TLSHandshakeTimeout: 3 * time.Second,
		ForceAttemptHTTP2:   true,
		MaxIdleConnsPerHost: 2,
		IdleConnTimeout:     time.Minute,
	}
	return httpsDNSProvider{endpoint: endpoint, client: &http.Client{
		Transport: transport, Timeout: 3 * time.Second,
		CheckRedirect: func(*http.Request, []*http.Request) error {
			return errors.New("DNS endpoint redirects are not allowed")
		},
	}}
}

var httpsDNSProviders = []httpsDNSProvider{
	// DNSPod's documented hostname route is usable on networks where overseas
	// HTTPS resolver connections are intermittent. No retired bootstrap IPs.
	newHTTPSDNSProvider("https://doh.pub/dns-query", ""),
	newHTTPSDNSProvider("https://cloudflare-dns.com/dns-query", "1.1.1.1"),
	newHTTPSDNSProvider("https://dns.google/resolve", "8.8.8.8"),
}

func queryPublicDNS(ctx context.Context, host string) ([]net.IP, time.Duration, error) {
	if len(httpsDNSProviders) == 0 {
		return nil, 0, errors.New("public DNS lookup failed")
	}
	// Do not wait for DNS providers one by one. On a restricted network the
	// old sequential fallback could spend roughly 20 seconds per provider,
	// multiplying the delay before an image/video request even reached its
	// upstream. The first valid answer wins; every request is still bounded by
	// the caller's context and each answer is validated by provider.query.
	type result struct {
		ips []net.IP
		ttl time.Duration
		err error
	}
	lookupCtx, cancel := context.WithCancel(ctx)
	defer cancel()
	results := make(chan result, len(httpsDNSProviders))
	for _, provider := range httpsDNSProviders {
		go func(provider httpsDNSProvider) {
			qresults := make(chan result, 2)
			for _, qtype := range []int{1, 28} {
				go func(t int) {
					ips, ttl, err := provider.query(lookupCtx, host, t)
					qresults <- result{ips: ips, ttl: ttl, err: err}
				}(qtype)
			}
			var ips []net.IP
			ttl := time.Minute
			valid := true
			for i := 0; i < 2; i++ {
				select {
				case answer := <-qresults:
					if answer.err != nil {
						valid = false
					}
					ips = append(ips, answer.ips...)
					if len(answer.ips) > 0 && answer.ttl < ttl {
						ttl = answer.ttl
					}
				case <-lookupCtx.Done():
					return
				}
			}
			if valid && len(ips) > 0 {
				select {
				case results <- result{ips: ips, ttl: ttl}:
				case <-lookupCtx.Done():
				}
				return
			}
			select {
			case results <- result{err: errors.New("DNS provider returned no valid answer")}:
			case <-lookupCtx.Done():
			}
		}(provider)
	}
	failed := 0
	for failed < len(httpsDNSProviders) {
		select {
		case answer := <-results:
			if answer.err == nil && len(answer.ips) > 0 {
				cancel()
				return answer.ips, answer.ttl, nil
			}
			failed++
		case <-ctx.Done():
			return nil, 0, ctx.Err()
		}
	}
	return nil, 0, errors.New("public DNS lookup failed")
}

func (p httpsDNSProvider) query(ctx context.Context, host string, qtype int) ([]net.IP, time.Duration, error) {
	u, err := url.Parse(p.endpoint)
	if err != nil {
		return nil, 0, err
	}
	q := u.Query()
	q.Set("name", host)
	q.Set("type", fmt.Sprint(qtype))
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Accept", "application/dns-json")
	ApplyDefaultOutboundHeaders(req)
	response, err := p.client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, 0, errors.New("DNS resolver rejected lookup")
	}
	data, err := io.ReadAll(io.LimitReader(response.Body, (64<<10)+1))
	if err != nil || len(data) > 64<<10 {
		return nil, 0, errors.New("invalid DNS response length")
	}
	var answer dnsJSONResponse
	if err := json.Unmarshal(data, &answer); err != nil {
		return nil, 0, err
	}
	if answer.Status != 0 || answer.Truncated || len(answer.Question) != 1 ||
		normalizeOutboundHost(answer.Question[0].Name) != host || answer.Question[0].Type != qtype {
		return nil, 0, errors.New("invalid or unsuccessful DNS response")
	}
	var ips []net.IP
	ttl := time.Minute
	for _, record := range answer.Answer {
		if record.Type != qtype {
			continue
		}
		ip := net.ParseIP(record.Data)
		if ip == nil || (qtype == 1 && ip.To4() == nil) || (qtype == 28 && ip.To4() != nil) {
			return nil, 0, errors.New("invalid DNS address")
		}
		ips = append(ips, ip)
		if duration := time.Duration(record.TTL) * time.Second; duration < ttl {
			ttl = duration
		}
	}
	return ips, ttl, nil
}
