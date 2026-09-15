import { createErrorResponse, ToolResponse } from './types.js';
import * as net from 'node:net';
import * as dns from 'node:dns';
import { promisify } from 'node:util';
import type { APIRequestContext, APIResponse, BrowserContext } from 'playwright';

const dnsLookup = promisify(dns.lookup);

const ALLOWED_SCHEMES = ['http:', 'https:'];
const MAX_REDIRECTS = 10;

function prefixMask(prefixLength: number): bigint {
  return ((1n << BigInt(prefixLength)) - 1n) << BigInt(128 - prefixLength);
}

const IPV4_BLOCKED_RANGES: Array<[bigint, bigint]> = [
  [0x00000000n, 0xff000000n], // 0.0.0.0/8
  [0x0a000000n, 0xff000000n], // 10.0.0.0/8
  [0x64400000n, 0xffc00000n], // 100.64.0.0/10
  [0x7f000000n, 0xff000000n], // 127.0.0.0/8
  [0xa9fe0000n, 0xffff0000n], // 169.254.0.0/16
  [0xac100000n, 0xfff00000n], // 172.16.0.0/12
  [0xc0000000n, 0xffffff00n], // 192.0.0.0/24
  [0xc0000200n, 0xffffff00n], // 192.0.2.0/24
  [0xc0586300n, 0xffffff00n], // 192.88.99.0/24
  [0xc0a80000n, 0xffff0000n], // 192.168.0.0/16
  [0xc6120000n, 0xfffe0000n], // 198.18.0.0/15
  [0xc6336400n, 0xffffff00n], // 198.51.100.0/24
  [0xcb007100n, 0xffffff00n], // 203.0.113.0/24
  [0xe0000000n, 0xf0000000n], // 224.0.0.0/4
  [0xf0000000n, 0xf0000000n], // 240.0.0.0/4
];

const IPV6_BLOCKED_RANGES: Array<[bigint, bigint]> = [
  [0n, (1n << 128n) - 1n], // ::/128
  [1n, (1n << 128n) - 1n], // ::1/128
  [0xffffn << 32n, prefixMask(96)], // ::ffff:0:0/96 (IPv4-mapped)
  [0x0064ff9b000000000000000000000000n, prefixMask(96)], // 64:ff9b::/96 (NAT64)
  [0x01000000000000000000000000000000n, prefixMask(64)], // 100::/64 (discard)
  [0x20010000000000000000000000000000n, prefixMask(23)], // 2001::/23 (Teredo et al.)
  [0x20020000000000000000000000000000n, prefixMask(16)], // 2002::/16 (6to4)
  [0xfc000000000000000000000000000000n, prefixMask(7)], // fc00::/7 (ULA)
  [0xfe800000000000000000000000000000n, prefixMask(10)], // fe80::/10 (link-local)
  [0xff000000000000000000000000000000n, prefixMask(8)], // ff00::/8 (multicast)
];

function ipv4ToInt(ip: string): bigint {
  return BigInt(
    ip.split('.').reduce((acc, oct) => (acc << 8) | Number(oct), 0) >>> 0
  );
}

function parseIpv6(ip: string): bigint | null {
  const lower = ip.toLowerCase();
  if (!lower.includes(':')) return null;

  let tail = lower;
  let v4Tail = '';
  const lastColon = lower.lastIndexOf(':');
  const maybeV4 = lower.slice(lastColon + 1);
  if (maybeV4.includes('.')) {
    if (!net.isIPv4(maybeV4)) return null;
    v4Tail = maybeV4;
    tail = lower.slice(0, lastColon + 1) || ':';
  }

  const doubleColon = tail.split('::');
  if (doubleColon.length > 2) return null;

  let headParts: string[];
  let tailParts: string[];
  if (doubleColon.length === 2) {
    headParts = doubleColon[0] === '' ? [] : doubleColon[0].split(':');
    tailParts = doubleColon[1] === '' ? [] : doubleColon[1].split(':');
  } else {
    headParts = tail === '' || tail === ':' ? [] : tail.split(':');
    tailParts = [];
  }

  const totalGroups = headParts.length + tailParts.length + (v4Tail ? 2 : 0);
  if (totalGroups > 8) return null;
  if (doubleColon.length === 1 && totalGroups !== 8) return null;

  const missing = 8 - totalGroups;
  const groups: string[] = [
    ...headParts,
    ...Array(Math.max(missing, 0)).fill('0'),
    ...tailParts,
  ];

  if (v4Tail) {
    const v4 = ipv4ToInt(v4Tail);
    groups.push(((v4 >> 16n) & 0xffffn).toString(16));
    groups.push((v4 & 0xffffn).toString(16));
  }

  if (groups.length !== 8) return null;

  let result = 0n;
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    result = (result << 16n) | BigInt(parseInt(g, 16));
  }
  return result;
}

export function isBlockedAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    const ipInt = ipv4ToInt(address);
    return IPV4_BLOCKED_RANGES.some(
      ([network, mask]) => (ipInt & mask) === network
    );
  }
  const ip6 = parseIpv6(address);
  if (ip6 === null) return true; // unparseable address: fail closed
  return IPV6_BLOCKED_RANGES.some(
    ([network, mask]) => (ip6 & mask) === network
  );
}

function unbracketHostname(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;
}

/**
 * Returns an error message if the URL must not be fetched, or null if allowed.
 * Resolves hostnames and checks every returned address (A + AAAA), failing
 * closed on DNS errors.
 */
export async function checkUrl(rawUrl: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return `Invalid URL: ${rawUrl}`;
  }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
    return `Blocked scheme: ${parsed.protocol}. Only http(s) is allowed.`;
  }

  if (parsed.username || parsed.password) {
    return 'URLs with embedded credentials are not allowed.';
  }

  const hostname = unbracketHostname(parsed.hostname);

  if (net.isIP(hostname)) {
    return isBlockedAddress(hostname)
      ? `Blocked address: ${hostname} is in a private, reserved, or internal range.`
      : null;
  }

  let addresses: dns.LookupAddress[];
  try {
    addresses = await dnsLookup(hostname, { all: true, verbatim: true });
  } catch {
    return `Could not resolve hostname: ${hostname}`;
  }

  if (!addresses.length) {
    return `Hostname resolved to no addresses: ${hostname}`;
  }

  for (const { address } of addresses) {
    if (isBlockedAddress(address)) {
      return `Blocked: ${hostname} resolves to private or internal address ${address}.`;
    }
  }

  return null;
}

export async function validateUrl(rawUrl: string): Promise<ToolResponse | null> {
  const violation = await checkUrl(rawUrl);
  return violation ? createErrorResponse(violation) : null;
}

/**
 * Installs a context-wide request guard that re-validates every request URL,
 * covering redirects, subresource loads, and new pages/tabs in the context.
 */
export async function installNavigationGuard(context: BrowserContext): Promise<void> {
  await context.route('**/*', async (route) => {
    const violation = await checkUrl(route.request().url());
    if (violation) {
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
}

/**
 * Performs a request with per-hop validation: redirects are followed manually
 * and each destination is checked before being fetched.
 */
export async function fetchWithValidation(
  apiContext: APIRequestContext,
  options: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    data?: string | object;
  }
): Promise<APIResponse> {
  let current = options.url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const violation = await checkUrl(current);
    if (violation) {
      throw new Error(violation);
    }

    const response = await apiContext.fetch(current, {
      method: options.method,
      headers: options.headers,
      data: options.data as any,
      maxRedirects: 0,
    });

    const status = response.status();
    const location = response.headers()['location'];
    if (status >= 300 && status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }
    return response;
  }

  throw new Error(`Too many redirects (>${MAX_REDIRECTS})`);
}
