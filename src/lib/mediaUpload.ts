
import * as tus from 'tus-js-client';
import * as ImageManipulator from 'expo-image-manipulator';
import { File as ExpoFile } from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export const MEDIA_BUCKET = 'britume-media';

export const MEDIA_LIMITS = {
  image: 15 * 1024 * 1024,
  storyVideo: 100 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  reel: 1024 * 1024 * 1024,
};

export const STORAGE_FILE_LIMIT = 50 * 1024 * 1024;

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

    const blob = await response.blob();
    return blob.size;
  }

  const file = new ExpoFile(uri);

  if (!file.exists) {
    throw new Error('The image file could not be found.');
  }

  return file.size;
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

  // Do not flatten animated GIFs into a single still image.
  if (originalType === 'image/gif') {
    const size = await getFileSize(uri);

    if (!size) {
      throw new Error('The GIF image is empty.');
    }

    if (size > MEDIA_LIMITS.image) {
      throw new Error(
        'This GIF is larger than the 15 MB image limit. Please choose a smaller GIF.',
      );
    }

    return {
      uri,
      name: `britume-${Date.now()}.gif`,
      mimeType: 'image/gif',
      size,
    };
  }

  // Preserve PNG format and transparency.
  const preservePng = originalType === 'image/png';

  let result;

  try {
    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 2560 } }],
      {
        compress: preservePng ? 1 : 0.78,
        format: preservePng
          ? ImageManipulator.SaveFormat.PNG
          : ImageManipulator.SaveFormat.JPEG,
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
      'The image is still larger than 15 MB after compression. Please choose a smaller image.',
    );
  }

  const mimeType = preservePng ? 'image/png' : 'image/jpeg';
  const extension = preservePng ? 'png' : 'jpg';

  return {
    uri: result.uri,
    name: `britume-${Date.now()}.${extension}`,
    mimeType,
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
    throw new Error('Please sign in again before uploading.');
  }

  const projectId = getProjectId();

  const uploadSource =
    Platform.OS === 'web'
      ? source
      : {
          uri: (source as { uri: string }).uri,
          name: (source as { name: string }).name,
          type: mimeType,
        };

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(uploadSource as any, {
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
        reject(new Error(`Upload failed: ${error.message}`));
      },

      onProgress(
        uploadedBytes: number,
        totalBytes: number,
      ) {
        const percent =
          totalBytes > 0
            ? Math.round((uploadedBytes / totalBytes) * 100)
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
