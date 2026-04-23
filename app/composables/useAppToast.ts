export interface AppToast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export function useAppToast() {
  const toasts = useState<AppToast[]>('app-toasts', () => [])

  function show(message: string, type: AppToast['type'] = 'success') {
    if (process.server) return
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      const idx = toasts.value.findIndex(t => t.id === id)
      if (idx !== -1) toasts.value.splice(idx, 1)
    }, 2000)
  }

  function dismiss(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  return { toasts, show, dismiss }
}
