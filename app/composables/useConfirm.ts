import { ref } from 'vue'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  danger: boolean
  resolve: ((v: boolean) => void) | null
}

const state = ref<ConfirmState>({
  open: false,
  title: 'Are you sure?',
  message: '',
  confirmLabel: 'Confirm',
  danger: false,
  resolve: null
})

export function useConfirm() {
  function confirm(
    message: string,
    title = 'Are you sure?',
    confirmLabel = 'Delete',
    danger = true
  ): Promise<boolean> {
    return new Promise(resolve => {
      state.value = { open: true, title, message, confirmLabel, danger, resolve }
    })
  }

  function accept() {
    state.value.resolve?.(true)
    state.value.open = false
  }

  function cancel() {
    state.value.resolve?.(false)
    state.value.open = false
  }

  return { state, confirm, accept, cancel }
}
