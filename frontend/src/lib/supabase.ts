import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://imgwjychhygtfyczsijd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('Supabase anon key not configured. File uploads will not work.');
}

// Create Supabase client for frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name
export const STORAGE_BUCKET = 'documents';

// Upload a file to Supabase Storage
export async function uploadFile(
  file: File,
  tenantId: string,
  _onProgress?: (progress: number) => void
): Promise<{ path: string; url: string } | { error: string }> {
  try {
    // Generate unique path: tenant_id/timestamp_filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${tenantId}/${timestamp}_${safeName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { error: error.message };
    }

    // Get signed URL for accessing the file (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(data.path, 3600);

    if (urlError) {
      console.error('URL error:', urlError);
      return { error: urlError.message };
    }

    return {
      path: data.path,
      url: urlData.signedUrl,
    };
  } catch (err) {
    console.error('Upload failed:', err);
    return { error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

// Upload multiple files
export async function uploadFiles(
  files: File[],
  tenantId: string,
  onFileComplete?: (filename: string, index: number, total: number) => void
): Promise<{ successes: Array<{ file: string; path: string; url: string }>; failures: Array<{ file: string; error: string }> }> {
  const successes: Array<{ file: string; path: string; url: string }> = [];
  const failures: Array<{ file: string; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadFile(file, tenantId);

    if ('error' in result) {
      failures.push({ file: file.name, error: result.error });
    } else {
      successes.push({ file: file.name, ...result });
    }

    onFileComplete?.(file.name, i + 1, files.length);
  }

  return { successes, failures };
}

// Get a signed URL for an existing file
export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Failed to get signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

// Delete a file from storage
export async function deleteFile(path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    return false;
  }

  return true;
}

// Download file content as text (for processing)
export async function downloadFileAsText(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(path);

  if (error) {
    console.error('Download error:', error);
    return null;
  }

  return await data.text();
}

// Download file content as base64 (for images/PDFs)
export async function downloadFileAsBase64(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(path);

  if (error) {
    console.error('Download error:', error);
    return null;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(data);
  });
}
