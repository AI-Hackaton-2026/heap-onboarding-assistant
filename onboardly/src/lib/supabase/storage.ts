// Supabase Storage helpers for the `uploads` bucket.
// Always uses the service-role server client — the bucket is private, so all
// access must go through the server. Never call these from a client component.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const BUCKET = "uploads";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

/**
 * Upload a file buffer to Storage and return the storage path.
 * Path: `uploads/{projectId}/{uuid}-{sanitisedFilename}`.
 */
export async function uploadFile(
  projectId: string,
  filename: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const supabase = adminClient();
  const uuid = crypto.randomUUID();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${projectId}/${uuid}-${safe}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return path;
}

/** Delete a file from Storage by its stored path. Non-fatal if already gone. */
export async function deleteFile(storagePath: string): Promise<void> {
  const supabase = adminClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error && !error.message.includes("Not Found")) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}

/**
 * Generate a short-lived signed download URL (60 minutes).
 * Use this whenever a member needs to download the original file.
 */
export async function getSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const supabase = adminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }
  return data.signedUrl;
}
