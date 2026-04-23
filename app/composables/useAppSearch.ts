/** Global header search; shared across the shell and list pages. */
export function useAppSearch() {
  return useState<string>('cope-admin-search', () => '')
}

export function rowMatchesAppSearch(
  query: string,
  ...fields: (string | number | undefined | null)[]
) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((f) => String(f ?? '').toLowerCase().includes(q))
}
