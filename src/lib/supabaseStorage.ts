import { supabase } from './supabase';

interface UploadOptions {
  folder?: string;
  public?: boolean;
}

/**
 * Upload a file to Supabase storage
 */
export async function uploadFile(file: File, options: UploadOptions = {}) {
  const { folder = 'misc', public: isPublic = true } = options;
  
  try {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = `${folder}/${filename}`;

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filepath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filepath);

    return {
      path: filepath,
      url: urlData.publicUrl,
      filename: file.name,
    };
  } catch (error) {
    console.error('[v0] Upload error:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase storage
 */
export async function deleteFile(filepath: string) {
  try {
    const { error } = await supabase.storage
      .from('uploads')
      .remove([filepath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[v0] Delete error:', error);
    throw error;
  }
}

/**
 * Upload multiple files (photos, documents)
 */
export async function uploadMultipleFiles(
  files: File[],
  folder: string
): Promise<{ path: string; url: string; filename: string }[]> {
  const uploads = await Promise.all(
    files.map((file) => uploadFile(file, { folder }))
  );
  return uploads;
}

/**
 * Get public URL for a file path
 */
export function getPublicUrl(filepath: string) {
  const { data } = supabase.storage
    .from('uploads')
    .getPublicUrl(filepath);

  return data.publicUrl;
}
