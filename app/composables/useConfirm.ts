interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  danger: boolean
}

let _resolve: ((v: boolean) => void) | null = null

export function useConfirm() {
  const state = useState<ConfirmState>('confirm-dialog', () => ({
    open: false,
    title: 'Are you sure?',
    message: '',
    confirmLabel: 'Confirm',
    danger: false,
  }))

  function confirm(
    message: string,
    title = 'Are you sure?',
    confirmLabel = 'Delete',
    danger = true
  ): Promise<boolean> {
    return new Promise(resolve => {
      _resolve = resolve
      state.value = { open: true, title, message, confirmLabel, danger }
    })
  }

  function accept() {
    _resolve?.(true)
    _resolve = null
    state.value.open = false
  }

  function cancel() {
    _resolve?.(false)
    _resolve = null
    state.value.open = false
  }

  return { state, confirm, accept, cancel }
}
