# 外部服务域名解析恢复

本机 DNS 失败时，软件对公开域名使用 DNSPod / Cloudflare / Google 的 HTTPS DNS 进行备用解析。DNSPod 的官方域名入口先用于降低境外解析连接波动的影响，正常的本机解析结果保持优先。备用解析只传送公开域名，不传 API Key、提示词或图片。

备用解析检查 A、AAAA 响应，缓存不超过 DNS TTL 或 60 秒；私网、保留地址、重定向与 HTTPS 证书检查继续生效。内部域名、单段主机名和已配置的私网上游不使用公共备用解析。可通过 `CANVAS_DNS_HTTPS_FALLBACK=0` 关闭。

这项恢复只处理 DNS，不会重试模型生成 HTTP 请求。已经失败或提交过的生图任务保留原始状态，恢复连接后仍须按原有授权与任务记录处理。

协议依据：

- [DNSPod 官方 HTTPS DNS 域名入口公告](https://docs.dnspod.cn/notices/mian-fei-ban-dot-dohbu-zai-gong-kai-ipjie-ru-de-gong-gao/)
- [Cloudflare JSON DNS 文档](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/dns-json/)
- [Google HTTPS DNS JSON API](https://developers.google.com/speed/public-dns/docs/doh/json)
