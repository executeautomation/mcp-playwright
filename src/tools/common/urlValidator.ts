import { createErrorResponse, ToolResponse } from './types.js';
import * as net from 'net';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve);

const ALLOWED_SCHEMES = ['http:', 'https:'];

const BLOCKED_IP_RANGES: Array<{ network: string; prefix: number }> = [
  { network: '127.0.0.0', prefix: 8 },
  { network: '10.0.0.0', prefix: 8 },
  { network: '172.16.0.0', prefix: 12 },
  { network: '192.168.0.0', prefix: 16 },
  { network: '169.254.0.0', prefix: 16 },
  { network: '0.0.0.0', prefix: 8 },
  { network: '100.64.0.0', prefix: 10 },
];

const BLOCKED_IPV6_PREFIXES = ['::1', 'fe80:', 'fc00:', 'fd00:'];

function ipToInt(ip: string): number {
  return ip.split('.').map(Number).reduce((acc, oct) => (acc << 8) | oct, 0) >>> 0;
}

function isIpBlocked(ip: string): boolean {
  if (ip.includes(':')) {
    return BLOCKED_IPV6_PREFIXES.some(p => ip.toLowerCase().startsWith(p));
  }
  if (!net.isIPv4(ip)) return false;
  const ipInt = ipToInt(ip);
  for (const { network, prefix } of BLOCKED_IP_RANGES) {
    const mask = (~0 << (32 - prefix)) >>> 0;
    if ((ipInt & mask) === (ipToInt(network) & mask)) return true;
  }
  return false;
}

export async function validateUrl(url: string): Promise<ToolResponse | null> {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return createErrorResponse('Invalid URL: ' + url); }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
    return createErrorResponse('Blocked scheme: ' + parsed.protocol + '. Only HTTP(S) allowed.');
  }

  if (net.isIP(parsed.hostname) && isIpBlocked(parsed.hostname)) {
    return createErrorResponse('SSRF blocked: ' + parsed.hostname + ' is a private address.');
  }

  try {
    const addrs = await dnsResolve(parsed.hostname);
    for (const addr of addrs) {
      if (isIpBlocked(addr)) {
        return createErrorResponse('SSRF blocked: ' + parsed.hostname + ' resolves to private IP ' + addr);
      }
    }
  } catch { /* DNS failure — let Playwright handle it */ }

  return null;
}
