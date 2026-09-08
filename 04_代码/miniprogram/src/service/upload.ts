import { API_BASE_URL } from '@/config'
import { handleAuthExpired, readToken } from '@/store/session'
import type { ApiResponse } from './types'

interface UploadData {
  url: string
}

/** 使用与业务请求相同的会话令牌上传单个文件。 */
export function uploadFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = readToken()
    uni.uploadFile({
      url: API_BASE_URL + '/api/upload',
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (response) => {
        if (response.statusCode === 401) {
          reject(handleAuthExpired())
          return
        }
        try {
          const payload = JSON.parse(String(response.data || '')) as ApiResponse<UploadData>
          if (payload.code === 401) {
            reject(handleAuthExpired())
            return
          }
          if (response.statusCode >= 200 && response.statusCode < 300 && payload.code === 0 && payload.data?.url) {
            resolve(payload.data.url)
            return
          }
          reject(new Error(payload.message || '上传失败'))
        } catch {
          reject(new Error('上传响应格式异常'))
        }
      },
      fail: () => reject(new Error('网络异常，上传失败')),
    })
  })
}
