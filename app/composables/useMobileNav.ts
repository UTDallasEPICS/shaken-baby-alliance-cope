export function useMobileNav() {
  const open = useState('mobile-nav-open', () => false)
  const toggle = () => { open.value = !open.value }
  const close = () => { open.value = false }
  return { open, toggle, close }
}
