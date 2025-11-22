import { randomUUID } from "node:crypto";
import { promises as fs, constants as fsConstants } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export interface ResourceLink {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  size?: number;
}

interface FileResource extends ResourceLink {
  id: string;
  filePath: string;
  expiresAt: number;
  timeout?: NodeJS.Timeout;
}

const DEFAULT_TTL_MS = 3 * 60 * 1000;
const fileResources = new Map<Server, Map<string, FileResource>>();
let linkingEnabled = false;
let ttlMs = DEFAULT_TTL_MS;
type ResourceUriBuilder = (args: { server: Server; id: string; filename: string }) => string | undefined;
let resourceUriBuilder: ResourceUriBuilder | undefined;
type SessionIdResolver = (server: Server) => string | undefined;
let resolveSessionId: SessionIdResolver | undefined;
let resourceBaseDir: string | null = null;
let warnedFallback = false;

const EXT_MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".json": "application/json",
  ".js": "application/javascript",
  ".ts": "application/typescript",
};

export function configureResourceManager({
  enabled,
  ttlSeconds,
  buildResourceUri,
  getSessionId,
}: {
  enabled: boolean;
  ttlSeconds?: number;
  buildResourceUri?: ResourceUriBuilder;
  getSessionId?: SessionIdResolver;
}) {
  linkingEnabled = enabled;
  ttlMs = Math.max(1, Math.floor((ttlSeconds ?? DEFAULT_TTL_MS / 1000) * 1000));
  resourceUriBuilder = buildResourceUri;
  resolveSessionId = getSessionId;
  cleanupExpired();
}

export function getSessionIdForServer(server?: Server): string | undefined {
  if (!server) return undefined;
  return resolveSessionId?.(server);
}

async function cleanupExpired() {
  const now = Date.now();
  for (const [server, resourceMap] of fileResources) {
    let removed = false;
    const dirsToCheck = new Set<string>();
    for (const [uri, resource] of resourceMap) {
      if (resource.expiresAt <= now) {
        if (resource.timeout) {
          clearTimeout(resource.timeout);
        }
        resourceMap.delete(uri);
        dirsToCheck.add(path.dirname(resource.filePath));
        try {
          await fs.unlink(resource.filePath);
        } catch {
          // ignore
        }
        removed = true;
      }
    }
    for (const dir of dirsToCheck) {
      await removeDirIfEmpty(dir);
    }
    if (removed && server.sendResourceListChanged) {
      try {
        await server.sendResourceListChanged();
      } catch (error) {
        console.warn("Failed to send resource list changed notification:", error);
      }
    }
  }
}

function getResourceStore(server: Server): Map<string, FileResource> {
  let store = fileResources.get(server);
  if (!store) {
    store = new Map();
    fileResources.set(server, store);
  }
  return store;
}

export function clearResourcesForServer(server: Server) {
  const store = fileResources.get(server);
  if (!store) return;
  const dirsToCheck = new Set<string>();
  for (const [, resource] of store) {
    if (resource.timeout) {
      clearTimeout(resource.timeout);
    }
    try {
      fs.unlink(resource.filePath).catch(() => {});
    } catch {
      // ignore
    }
    dirsToCheck.add(path.dirname(resource.filePath));
  }
  fileResources.delete(server);
  Promise.all([...dirsToCheck].map((dir) => removeDirIfEmpty(dir))).catch(() => {});
}

async function ensureResourceBaseDir(): Promise<string> {
  if (resourceBaseDir) return resourceBaseDir;

  const preferred = path.join(path.sep, "data");
  const fallback = path.join(os.tmpdir(), "mcp-resources");

  try {
    await fs.mkdir(preferred, { recursive: true });
    await fs.access(preferred, fsConstants.W_OK);
    resourceBaseDir = preferred;
    return resourceBaseDir;
  } catch {
    // fall back to tmpdir
  }

  if (!warnedFallback) {
    console.warn(`Resource base ${preferred} not writable; falling back to ${fallback}`);
    warnedFallback = true;
  }
  await fs.mkdir(fallback, { recursive: true });
  resourceBaseDir = fallback;
  return resourceBaseDir;
}

/**
 * Register a file-backed resource and optionally notify clients that the list changed.
 */
export async function registerFileResource({
  filePath,
  name,
  description,
  mimeType,
  server,
}: {
  filePath: string;
  name?: string;
  description?: string;
  mimeType?: string;
  server?: Server;
}): Promise<ResourceLink | undefined> {
  if (!linkingEnabled || !server) {
    return undefined;
  }

  const sessionId = resolveSessionId?.(server);
  if (!sessionId) {
    return undefined;
  }

  const absolutePath = path.resolve(filePath);
  const stats = await fs.stat(absolutePath);
  const id = randomUUID();
  const filename = name ?? path.basename(absolutePath);
  const uri = resourceUriBuilder?.({ server, id, filename: path.basename(filename) }) ?? `mcp-resource://${id}`;
  const resolvedMime = mimeType ?? EXT_MIME_MAP[path.extname(filename).toLowerCase()];

  const baseDir = await ensureResourceBaseDir();
  const sessionDir = path.join(baseDir, sessionId);
  await fs.mkdir(sessionDir, { recursive: true });
  const ext = path.extname(filename) || "";
  const storagePath = path.join(sessionDir, `${id}${ext}`);
  await fs.copyFile(absolutePath, storagePath);

  const expiresAt = Date.now() + ttlMs;
  const resource: FileResource = {
    id,
    uri,
    name: filename,
    description,
    mimeType: resolvedMime,
    size: stats.size,
    filePath: storagePath,
    expiresAt,
  };

  const store = getResourceStore(server);
  const existing = Array.from(store.values()).find((r) => r.uri === uri);
  if (existing?.timeout) {
    clearTimeout(existing.timeout);
  }

  resource.timeout = setTimeout(async () => {
    store.delete(resource.id);
    try {
      await fs.unlink(resource.filePath);
    } catch {
      // ignore
    }
    await removeDirIfEmpty(path.dirname(resource.filePath));
    if (server.sendResourceListChanged) {
      try {
        await server.sendResourceListChanged();
      } catch (error) {
        console.warn("Failed to send resource list changed notification:", error);
      }
    }
  }, ttlMs);

  store.set(resource.id, resource);

  // Notify clients that the list changed, if the server supports it.
  if (server.sendResourceListChanged) {
    try {
      await server.sendResourceListChanged();
    } catch (error) {
      // Swallow notification errors to avoid breaking the tool response path.
      console.warn("Failed to send resource list changed notification:", error);
    }
  }

  return {
    uri: resource.uri,
    name: resource.name,
    description: resource.description,
    mimeType: resource.mimeType,
    size: resource.size,
  };
}

export async function listFileResources(server: Server): Promise<ResourceLink[]> {
  await cleanupExpired();
  const store = fileResources.get(server);
  if (!store) return [];
  return Array.from(store.values()).map(({ uri, name, description, mimeType, size }) => ({
    uri,
    name,
    description,
    mimeType,
    size,
  }));
}

export async function readFileResource(
  uri: string,
  server: Server,
): Promise<{
  resource: ResourceLink;
  text?: string;
  blob?: string;
} | null> {
  await cleanupExpired();
  const store = fileResources.get(server);
  if (!store) return null;
  const resource = Array.from(store.values()).find((r) => {
    if (r.uri === uri) return true;
    const lower = uri.toLowerCase();
    if (lower.startsWith("mcp-resource://")) {
      const id = uri.replace("mcp-resource://", "");
      return r.id === id;
    }
    try {
      const url = new URL(uri);
      const parts = url.pathname.split("/").filter(Boolean);
      const idPart = parts.length >= 2 ? parts[parts.length - 2] : undefined;
      return idPart === r.id;
    } catch {
      return false;
    }
  });
  if (!resource) return null;

  const data = await fs.readFile(resource.filePath);
  const isText =
    resource.mimeType?.startsWith("text/") ||
    resource.mimeType === "application/json" ||
    resource.mimeType === "application/javascript" ||
    resource.mimeType === "application/typescript";

  return {
    resource,
    ...(isText ? { text: data.toString("utf8") } : { blob: data.toString("base64") }),
  };
}

export async function getFileResourceById(server: Server, id: string): Promise<FileResource | null> {
  await cleanupExpired();
  const store = fileResources.get(server);
  if (!store) return null;
  return store.get(id) ?? null;
}

export async function removeDirIfEmpty(dir: string) {
  try {
    const entries = await fs.readdir(dir);
    if (entries.length === 0) {
      await fs.rmdir(dir);
      console.log(`Removed empty resource directory: ${dir}`);
    }
  } catch {
    // ignore
  }
}
