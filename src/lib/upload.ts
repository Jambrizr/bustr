import { supabase } from './supabase';

interface UploadChunk {
  file: File;
  start: number;
  end: number;
  chunkNumber: number;
  totalChunks: number;
}

interface UploadProgress {
  progress: number;
  uploaded: number;
  total: number;
}

interface ChunkMetadata {
  fileName: string;
  chunkNumber: number;
  totalChunks: number;
  fileSize: number;
}

const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks

export class UploadManager {
  private static async checkRateLimit(): Promise<{ 
    canUpload: boolean; 
    resetTime?: string;
    remaining?: number;
  }> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-rate-limit`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 429) {
        return { 
          canUpload: false, 
          resetTime: data.resetTime 
        };
      }

      return { 
        canUpload: true, 
        remaining: data.remaining 
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { canUpload: false };
    }
  }

  private static async uploadChunk({ 
    file, 
    start, 
    end, 
    chunkNumber, 
    totalChunks 
  }: UploadChunk): Promise<string> {
    const chunk = file.slice(start, end);
    
    // Create metadata for the chunk
    const metadata: ChunkMetadata = {
      fileName: file.name,
      chunkNumber,
      totalChunks,
      fileSize: file.size
    };

    // Create FormData with chunk and metadata
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('metadata', JSON.stringify(metadata));

    // Upload chunk using the Edge Function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chunked-upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: formData
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload chunk');
    }

    const data = await response.json();
    return data.success ? `${file.name}.part${chunkNumber}` : '';
  }

  static async uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Check rate limit first
    const { canUpload, resetTime, remaining } = await this.checkRateLimit();
    
    if (!canUpload) {
      throw new Error(
        `Upload rate limit exceeded. Please try again after ${resetTime}`
      );
    }

    // Calculate chunks
    const chunks: UploadChunk[] = [];
    let start = 0;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    while (start < file.size) {
      const end = Math.min(start + CHUNK_SIZE, file.size);
      chunks.push({
        file,
        start,
        end,
        chunkNumber: chunks.length + 1,
        totalChunks
      });
      start = end;
    }

    // Upload chunks
    const chunkPaths: string[] = [];
    let uploadedBytes = 0;

    for (const chunk of chunks) {
      const chunkPath = await this.uploadChunk(chunk);
      if (chunkPath) {
        chunkPaths.push(chunkPath);
      }
      
      uploadedBytes += (chunk.end - chunk.start);
      
      if (onProgress) {
        onProgress({
          progress: (uploadedBytes / file.size) * 100,
          uploaded: uploadedBytes,
          total: file.size
        });
      }
    }

    // If single chunk, return the path directly
    if (chunkPaths.length === 1) {
      return chunkPaths[0];
    }

    // For multiple chunks, return the array of paths
    // The Edge Function will handle combining them
    return JSON.stringify(chunkPaths);
  }
}