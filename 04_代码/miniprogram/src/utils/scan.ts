export function scanSn(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.scanCode({
      onlyFromCamera: false,
      scanType: ['barCode', 'qrCode'],
      success: (res) => resolve(String(res.result || '').trim().toUpperCase()),
      fail: (err) => reject(err),
    })
  })
}

export async function scanOrPrompt(placeholder = '输入 SN'): Promise<string> {
  void placeholder
  return scanSn()
}
