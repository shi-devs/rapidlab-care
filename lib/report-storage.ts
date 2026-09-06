import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type StoredReport = {
  body: ReadableStream<Uint8Array> | null;
  contentType: string | null;
};

let client: SupabaseClient | null = null;

function storageConfig() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "lab-reports";

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase Storage is not configured in Vercel");
  }

  return { url, serviceRoleKey, bucket };
}

function storage() {
  const { url, serviceRoleKey, bucket } = storageConfig();
  client ??= createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client.storage.from(bucket);
}

export async function uploadReport(key: string, data: ArrayBuffer, contentType: string) {
  const { error } = await storage().upload(key, data, {
    contentType: contentType || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(`Could not store the report file: ${error.message}`);
}

export async function readReport(key: string): Promise<StoredReport | null> {
  const { data, error } = await storage().download(key);
  if (error && /not found/i.test(error.message)) return null;
  if (error || !data) throw new Error(`Could not read the report file${error ? `: ${error.message}` : ""}`);
  return {
    body: data.stream(),
    contentType: data.type || null,
  };
}

export async function deleteReport(key: string) {
  const { error } = await storage().remove([key]);
  if (error && !/not found/i.test(error.message)) {
    throw new Error(`Could not delete the report file: ${error.message}`);
  }
}
