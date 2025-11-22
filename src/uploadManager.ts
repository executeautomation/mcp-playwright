import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

interface UploadMeta {
  id: string;
  sessionId: string;
  filePath: string;
  name: string;
  mimeType?: string;
  size?: number;
}

const uploads = new Map<string, Map<string, UploadMeta>>();
const uploadsRoot = path.join(os.tmpdir(), "mcp-playwright", "uploads");
let uploadEndpointUrl: string | undefined;

export function setUploadEndpointUrl(url: string | undefined) {
  uploadEndpointUrl = url;
}

export function getUploadEndpointUrl(): string | undefined {
  return uploadEndpointUrl;
}

export function registerUploadedFile({
  sessionId,
  filePath,
  name,
  mimeType,
  size,
}: {
  sessionId: string;
  filePath: string;
  name: string;
  mimeType?: string;
  size?: number;
}) {
  const id = randomUUID();
  let store = uploads.get(sessionId);
  if (!store) {
    store = new Map();
    uploads.set(sessionId, store);
  }
  const meta: UploadMeta = {
    id,
    sessionId,
    filePath,
    name,
    mimeType,
    size,
  };
  store.set(id, meta);
  return {
    uri: `mcp-uploads://${sessionId}/${id}`,
    id,
    ...meta,
  };
}

export async function resolveUploadResource({
  resourceUri,
  sessionId,
}: {
  resourceUri: string;
  sessionId: string;
}): Promise<UploadMeta | null> {
  const parsed = parseUploadResourceUri(resourceUri);
  if (!parsed) return null;
  if (parsed.sessionId !== sessionId) return null;
  const store = uploads.get(sessionId);
  if (!store) return null;
  return store.get(parsed.id) ?? null;
}

export function parseUploadResourceUri(uri: string): { sessionId: string; id: string } | null {
  if (!uri.startsWith("mcp-uploads://") && !uri.startsWith("mcp+upload://")) return null;
  const withoutScheme = uri.replace("mcp-uploads://", "").replace("mcp+upload://", "");
  const parts = withoutScheme.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [sessionId, id] = parts;
  return { sessionId, id };
}

export async function cleanupUpload(sessionId: string, uploadId: string) {
  const store = uploads.get(sessionId);
  if (!store) return;
  const meta = store.get(uploadId);
  if (!meta) return;
  store.delete(uploadId);
  try {
    await fs.unlink(meta.filePath);
  } catch {
    // ignore
  }
  await removeDirIfEmpty(path.dirname(meta.filePath));
  await removeDirIfEmpty(path.join(uploadsRoot, sessionId));
  await removeDirIfEmpty(uploadsRoot);
}

export async function clearUploadsForSession(sessionId: string) {
  const store = uploads.get(sessionId);
  if (!store) return;
  for (const [uploadId, meta] of store.entries()) {
    try {
      await fs.unlink(meta.filePath);
    } catch {
      // ignore
    }
    await removeDirIfEmpty(path.dirname(meta.filePath));
    await removeDirIfEmpty(path.join(uploadsRoot, sessionId));
    await removeDirIfEmpty(uploadsRoot);
    store.delete(uploadId);
  }
  uploads.delete(sessionId);
}

export async function ensureUploadsDir(sessionId: string) {
  const sessionDir = path.join(uploadsRoot, sessionId);
  await fs.mkdir(sessionDir, { recursive: true });
  return sessionDir;
}

async function removeDirIfEmpty(dir: string) {
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
