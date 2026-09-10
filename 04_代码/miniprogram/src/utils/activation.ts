export type ActivationBatchPayload = Record<string, unknown>
export type ActivationBatchResponse = { data?: unknown }

export async function submitActivationBatch(
  request: (payload: ActivationBatchPayload) => Promise<ActivationBatchResponse>,
  payload: ActivationBatchPayload,
  sns: string[],
  confirmWarnings: (issues: string[]) => Promise<boolean>,
) {
  const batch = { ...payload, sns: [...sns] }
  const preview = await request({ ...batch, dryRun: true })
  const previewIssues = issuesOf(preview)
  if (previewIssues.length && !await confirmWarnings(previewIssues)) {
    return { committed: false, issues: previewIssues, response: null }
  }
  const response = await request(batch)
  return {
    committed: true,
    issues: issuesOf(response),
    response,
  }
}

function issuesOf(response: ActivationBatchResponse) {
  const data = response.data
  const values = data && typeof data === 'object' && 'issues' in data
    ? (data as { issues?: unknown }).issues
    : undefined
  return uniqueIssues(Array.isArray(values) ? values : undefined)
}

function uniqueIssues(values: unknown[] | undefined) {
  return [...new Set((values || []).map(String))]
}
