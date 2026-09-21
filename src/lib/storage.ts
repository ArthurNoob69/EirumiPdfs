import { del } from '@vercel/blob';

/**
 * Deletes an object from Vercel Blob
 * @param url The URL of the blob to delete
 */
export async function deleteStorageObject(url: string): Promise<void> {
  try {
    await del(url);
  } catch (err) {
    console.error('Error deleting blob:', err);
    // Ignore error so we can delete from DB even if blob is already gone
  }
}
