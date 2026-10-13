import { supabase } from "./supabase.js";

const TABLE_NAME = "saved_items";
const BUCKET_NAME = "quickkeep-files";

function getClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function mapItem(row) {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    description: row.description ?? "",
    url: row.url ?? "",
    fileName: row.file_name,
    filePath: row.file_path,
    createdAt: row.created_at,
  };
}

export async function getSavedItems() {
  const { data, error } = await getClient()
    .from(TABLE_NAME)
    .select("id, kind, name, description, url, file_name, file_path, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapItem);
}

export async function saveSavedItem(item) {
  const client = getClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Sign in to save an item.");

  let filePath = null;
  if (item.file) {
    const safeFileName = item.file.name.replace(/[^\w.-]+/g, "_");
    filePath = `${authData.user.id}/${item.id}/${safeFileName}`;
    const { error } = await client.storage.from(BUCKET_NAME).upload(filePath, item.file, {
      contentType: item.file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;
  }

  const row = {
    id: item.id,
    user_id: authData.user.id,
    kind: item.kind,
    name: item.name,
    description: item.description,
    url: item.url || null,
    file_name: item.file?.name ?? null,
    file_path: filePath,
  };
  const { data, error } = await client.from(TABLE_NAME).insert(row).select().single();
  if (error) {
    if (filePath) await client.storage.from(BUCKET_NAME).remove([filePath]);
    throw error;
  }
  return mapItem(data);
}

export async function deleteSavedItem(id) {
  const client = getClient();
  const { data, error: readError } = await client
    .from(TABLE_NAME)
    .select("file_path")
    .eq("id", id)
    .maybeSingle();
  if (readError) throw readError;

  const { error } = await client.from(TABLE_NAME).delete().eq("id", id);
  if (error) throw error;
  if (data?.file_path) {
    const { error: fileError } = await client.storage.from(BUCKET_NAME).remove([data.file_path]);
    if (fileError) throw fileError;
  }
}

export async function getFileDownloadUrl(item) {
  const { data, error } = await getClient()
    .storage.from(BUCKET_NAME)
    .createSignedUrl(item.filePath, 60, { download: item.fileName });
  if (error) throw error;
  return data.signedUrl;
}