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
  try {
    return await scanSn()
  } catch {
    const { confirm, content } = await uni.showModal({
      title: '手动录入 SN',
      editable: true,
      placeholderText: placeholder,
    })
    if (!confirm) throw new Error('cancel')
    const sn = String(content || '').trim().toUpperCase()
    if (!sn) throw new Error('empty')
    return sn
  }
}
