import { env } from '@/env'
import ky from 'ky'
import { useState } from 'react'

export interface UploadedFile {
  url: string
  type: 'image' | 'file'
  name: string
  size: number
}

interface UploadResponse {
  code: number
  msg: string
  data: {
    url: string
  }
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (files: File[]): Promise<UploadedFile[]> => {
    setIsUploading(true)
    setError(null)

    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('prefix', 'playground')
          formData.append(
            'need_compress',
            file.type.startsWith('image/') ? 'true' : 'false'
          )

          const response = await ky
            .post(env.NEXT_PUBLIC_AI_302_API_UPLOAD_URL, {
              body: formData,
            })
            .json<UploadResponse>()

          if (response.code !== 0) {
            throw new Error(response.msg)
          }

          return {
            url: response.data.url,
            type: file.type.startsWith('image/') ? 'image' : 'file',
            name: file.name,
            size: file.size,
          } as UploadedFile
        })
      )

      return uploadedFiles
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      throw err
    } finally {
      setIsUploading(false)
    }
  }

  return {
    upload,
    isUploading,
    error,
  }
}
