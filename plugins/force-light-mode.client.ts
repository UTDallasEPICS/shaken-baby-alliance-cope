export default defineNuxtPlugin(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.body.classList.remove('dark')
    document.body.classList.add('light')
  }
})
