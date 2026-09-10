export function extractSegLines(text: string) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => String(line).split(/[\t,;；]/)[0].trim())
    .filter((c) => c && /RL/i.test(c))
}

export async function buildSnSegTemplate(): Promise<Uint8Array> {
  const XLSX = await import('xlsx')
  const sheet = XLSX.utils.aoa_to_sheet([
    ['SN号段（每行一个）'],
    ['RL202609100001-RL202609100010'],
  ])
  sheet['!cols'] = [{ wch: 36 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'SN号段')
  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  return new Uint8Array(output)
}

export async function readSegFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) {
    return file.text()
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
    return rows.map((r) => (r || []).join('\t')).join('\n')
  }
  throw new Error('请上传 Excel（.xlsx / .xls）或 CSV')
}
