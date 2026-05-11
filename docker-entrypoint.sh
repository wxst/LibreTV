#!/bin/sh
set -eu

if [ -n "${PROXY_URL:-}" ]; then
  protocol="$(printf '%s' "$PROXY_URL" | sed -E 's#^([A-Za-z0-9]+)://.*#\1#')"
  host_port="$(printf '%s' "$PROXY_URL" | sed -E 's#^[A-Za-z0-9]+://##; s#/.*$##')"
  host="$(printf '%s' "$host_port" | sed -E 's#:([0-9]+)$##')"
  port="$(printf '%s' "$host_port" | sed -E 's#^.*:([0-9]+)$#\1#')"

  case "$protocol" in
    http|socks4|socks5) ;;
    *)
      echo "Unsupported PROXY_URL protocol: $protocol" >&2
      exit 1
      ;;
  esac

  if [ -z "$host" ] || [ -z "$port" ] || [ "$host" = "$port" ]; then
    echo "Invalid PROXY_URL, expected protocol://host:port" >&2
    exit 1
  fi

  conf="/tmp/proxychains.conf"
  {
    echo "strict_chain"
    echo "proxy_dns"
    echo "remote_dns_subnet 224"
    echo "tcp_read_time_out 15000"
    echo "tcp_connect_time_out 8000"
    echo "localnet 127.0.0.0/255.0.0.0"
    echo "localnet ::1/128"
    echo "[ProxyList]"
    echo "$protocol $host $port"
  } > "$conf"

  exec proxychains4 -q -f "$conf" node server.mjs
fi

exec node server.mjs
