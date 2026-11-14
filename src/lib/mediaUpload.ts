import * as tus from 'tus-js-client';
import * as ImageManipulator from 'expo-image-manipulator';
import { File as ExpoFile } from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export const MEDIA_BUCKET = 'britume-media';

export const STORAGE_FILE_LIMIT = 50 * 1024 * 1024;
export const MAX_UPLOAD_SIZE = 48 * 1024 * 1024;

export const MEDIA_LIMITS = {
  image: 15 * 1024 * 1024,
  storyVideo: MAX_UPLOAD_SIZE,
  video: MAX_UPLOAD_SIZE,
  reel: MAX_UPLOAD_SIZE,
};

export type UploadSource =
  | {
      uri: string;
      name: string;
      type: string;
      size?: number;
    }
  | File;

export type UploadProgress = (
  percent: number,
  uploadedBytes: number,
  totalBytes: number,
) => void;

function getProjectId(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();

  if (!url) {
    throw new Error('Supabase URL is not configured.');
  }

  const match = url.match(
    /^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i,
  );

  if (!match) {
    throw new Error('Your Supabase project URL is invalid.');
  }

  return match[1];
}

function getImageType(uri: string, suppliedType?: string) {
  if (suppliedType) {
    return suppliedType.toLowerCase();
  }

  const cleanUri = uri.split('?')[0].split('#')[0];
  const extension = cleanUri.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'image/jpeg';
  }
}

async function getFileSize(uri: string): Promise<number> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error('Could not read the image file.');
    }

    return (await response.blob()).size;
  }

  const file = new ExpoFile(uri);

  if (!file.exists) {
    throw new Error('The image file could not be found.');
  }

  return file.size;
}

async function compressImageInBrowser(
  uri: string,
  originalType: string,
): Promise<{ uri: string; name: string; mimeType: string; size: number }> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('The browser could not read the selected image. Please select it again.');
  }

  const originalBlob = await response.blob();
  if (!originalBlob.size) {
    throw new Error('The selected image is empty. Please select it again.');
  }

  // If the browser does not provide the image APIs needed for compression,
  // allow a small original image to upload rather than failing the whole post.
  const useOriginal = async () => {
    if (originalBlob.size > MEDIA_LIMITS.image) {
      throw new Error('This browser could not compress the image, and the original is larger than 15 MB. Try a smaller image or another browser.');
    }
    return {
      uri,
      name: `britume-${Date.now()}.${originalType === 'image/png' ? 'png' : originalType === 'image/webp' ? 'webp' : 'jpg'}`,
      mimeType: originalType || 'image/jpeg',
      size: originalBlob.size,
    };
  };

  if (typeof createImageBitmap !== 'function') {
    return useOriginal();
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(originalBlob);
    const maxWidth = 2048;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return useOriginal();
    context.drawImage(bitmap, 0, 0, width, height);

    const compressedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.78);
    });
    if (!compressedBlob || !compressedBlob.size) return useOriginal();
    if (compressedBlob.size > MEDIA_LIMITS.image) {
      throw new Error('The compressed image is still larger than 15 MB. Please choose a smaller image.');
    }

    const objectUrl = URL.createObjectURL(compressedBlob);
    return {
      uri: objectUrl,
      name: `britume-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      size: compressedBlob.size,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('larger than 15 MB')) {
      throw error;
    }
    return useOriginal();
  } finally {
    bitmap?.close();
  }
}

export async function compressImage(
  uri: string,
  suppliedMimeType?: string,
): Promise<{
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}> {
  if (!uri) {
    throw new Error('No image was selected.');
  }

  const originalType = getImageType(uri, suppliedMimeType);

  if (originalType === 'image/gif') {
    const size = await getFileSize(uri);

    if (!size || size > MEDIA_LIMITS.image) {
      throw new Error(
        'This GIF must be 15 MB or smaller.',
      );
    }

    return {
      uri,
      name: `britume-${Date.now()}.gif`,
      mimeType: 'image/gif',
      size,
    };
  }

  if (Platform.OS === 'web') {
    return compressImageInBrowser(uri, originalType);
  }

  let result;

  try {
    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 2048 } }],
      {
        compress: 0.72,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';

    throw new Error(`Image compression failed: ${message}`);
  }

  const size = await getFileSize(result.uri);

  if (!size) {
    throw new Error('The compressed image is empty.');
  }

  if (size > MEDIA_LIMITS.image) {
    throw new Error(
      'The compressed image is still larger than 15 MB. Please choose a smaller image.',
    );
  }

  return {
    uri: result.uri,
    name: `britume-${Date.now()}.jpg`,
    mimeType: 'image/jpeg',
    size,
  };
}

export async function uploadMediaResumable(
  source: UploadSource,
  storagePath: string,
  mimeType: string,
  onProgress?: UploadProgress,
): Promise<void> {
  const client = supabase;

  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error(
      'Please sign in again before uploading.',
    );
  }

  if (Platform.OS !== 'web') {
    const uri = (source as { uri: string }).uri;
    const file = new ExpoFile(uri);

    if (!file.exists || !file.size) {
      throw new Error(
        'The selected file is unavailable. Please select it again.',
      );
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      throw new Error(
        'This file exceeds the current 48 MB upload limit.',
      );
    }

    onProgress?.(0, 0, file.size);

    let bytes: ArrayBuffer;

    try {
      bytes = await file.arrayBuffer();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      throw new Error(
        `Android could not read the selected file: ${message}`,
      );
    }

    if (!bytes.byteLength) {
      throw new Error('The selected file is empty.');
    }

    const { error } = await client.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, bytes, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    onProgress?.(100, bytes.byteLength, bytes.byteLength);
    return;
  }

  const projectId = getProjectId();

  const webSource = source as File;

  if (!(webSource instanceof File) || !webSource.size) {
    throw new Error(
      'The browser file is unavailable. Please select it again.',
    );
  }

  if (webSource.size > MAX_UPLOAD_SIZE) {
    throw new Error(
      'This file exceeds the current 48 MB upload limit.',
    );
  }

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(webSource, {
      endpoint:
        `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,

      retryDelays: [0, 3000, 5000, 10000, 20000],

      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey:
          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        'x-upsert': 'false',
      },

      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,

      metadata: {
        bucketName: MEDIA_BUCKET,
        objectName: storagePath,
        contentType: mimeType,
        cacheControl: '3600',
      },

      chunkSize: 6 * 1024 * 1024,

      onError(error: Error) {
        reject(
          new Error(`Upload failed: ${error.message}`),
        );
      },

      onProgress(uploadedBytes, totalBytes) {
        const percent = totalBytes > 0
          ? Math.round(
              (uploadedBytes / totalBytes) * 100,
            )
          : 0;

        onProgress?.(
          percent,
          uploadedBytes,
          totalBytes,
        );
      },

      onSuccess() {
        resolve();
      },
    });

    upload.start();
  });
}
