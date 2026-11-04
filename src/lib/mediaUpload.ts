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

/**
 * Compresses an image before upload.
 * Keeps the original aspect ratio.
 * Converts the result to an optimised JPEG.
 */
export async function compressImage(
  uri: string,
): Promise<{
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 2560 } }],
    {
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  let size = 0;

  if (Platform.OS === 'web') {
    const response = await fetch(result.uri);

    if (!response.ok) {
      throw new Error('Could not prepare the compressed image.');
    }

    const blob = await response.blob();
    size = blob.size;
  } else {
    const file = new ExpoFile(result.uri);

    if (!file.exists) {
      throw new Error('The compressed image could not be found.');
    }

    size = file.size;
  }

  if (!size) {
    throw new Error('The compressed image is empty.');
  }

  return {
    uri: result.uri,
    name: `britume-${Date.now()}.jpg`,
    mimeType: 'image/jpeg',
    size,
  };
}

/**
 * Uploads using Supabase TUS resumable uploads.
 * Does not read a complete native video into an ArrayBuffer.
 */
export async function uploadMediaResumable(
  source: UploadSource,
  storagePath: string,
  mimeType: string,
  onProgress?: UploadProgress,
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

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

      onError(error) {
        reject(
          new Error(`Upload failed: ${error.message}`),
        );
      },

      onProgress(uploadedBytes, totalBytes) {
        const percent =
          totalBytes > 0
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
