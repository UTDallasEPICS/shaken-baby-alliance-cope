<script setup lang="ts">
definePageMeta({ layout: false })

import { ref } from 'vue'
import { authClient } from '~/utils/auth-client'

const userId = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMsg = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const { data, error } = await authClient.signIn.email({
      email: userId.value,
      password: password.value,
    })
    if (error) {
      errorMsg.value = 'Invalid email or password. Please try again.'
      return
    }
    await navigateTo('/dashboard')
  } catch (err) {
    errorMsg.value = 'An unexpected error occurred.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex bg-[#f8fafc]" style="background: #f8fafc;">
    <div class="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-white shadow-sm rounded-[32px] border border-[#e5e7eb]">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: #C9A227;">
          <UIcon name="i-heroicons-shield-check-20-solid" class="w-6 h-6 text-white" />
        </div>
        <span class="text-slate-900 font-bold text-xl">Shaken Baby Alliance</span>
      </div>

      <div>
        <h1 class="text-4xl font-bold text-slate-900 leading-tight mb-4">
          Supporting families,<br />
          <span style="color: #C9A227;">one message at a time.</span>
        </h1>
        <p class="text-base text-slate-600">
          The COPE SMS Admin Portal helps you monitor caregiver outreach, manage workflows, and track every interaction securely.
        </p>

        <div class="mt-10 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: rgba(45,122,79,0.12);">
              <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" class="w-4 h-4" style="color: #2d7a4f;" />
            </div>
            <span class="text-sm text-slate-600">Real-time SMS caregiver messaging</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: rgba(45,122,79,0.12);">
              <UIcon name="i-heroicons-arrow-path-20-solid" class="w-4 h-4" style="color: #2d7a4f;" />
            </div>
            <span class="text-sm text-slate-600">Automated response workflows</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: rgba(45,122,79,0.12);">
              <UIcon name="i-heroicons-shield-check-20-solid" class="w-4 h-4" style="color: #2d7a4f;" />
            </div>
            <span class="text-sm text-slate-600">Secure, role-based access control</span>
          </div>
        </div>
      </div>

      <p class="text-xs text-slate-400">© 2026 Shaken Baby Alliance. All rights reserved.</p>
    </div>

    <div class="flex flex-1 items-center justify-center p-6">
      <div class="w-full max-w-md rounded-2xl p-8 shadow-2xl" style="background-color: #ffffff;">
        <div class="flex items-center gap-3 mb-8 lg:hidden">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background-color: #C9A227;">
            <UIcon name="i-heroicons-shield-check-20-solid" class="w-5 h-5 text-white" />
          </div>
          <span class="font-bold text-lg text-slate-900">Shaken Baby Alliance</span>
        </div>

        <div class="mb-7">
          <h2 class="text-2xl font-bold mb-1 text-slate-900">Welcome back</h2>
          <p class="text-sm text-slate-600">Sign in to access the COPE SMS Admin Portal</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label class="block text-xs font-semibold mb-1.5 text-slate-700">Email Address</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <UIcon name="i-heroicons-envelope-20-solid" class="w-4 h-4" style="color: #2D7A4F;" />
              </div>
              <input
                v-model="userId"
                type="email"
                placeholder="you@example.com"
                required
                class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all"
                style="border-color: #d1d5db; color: #0f172a;"
                @focus="(e) => (e.target as HTMLElement).style.borderColor = '#2D7A4F'"
                @blur="(e) => (e.target as HTMLElement).style.borderColor = '#d1d5db'"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1.5 text-slate-700">Password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <UIcon name="i-heroicons-lock-closed-20-solid" class="w-4 h-4" style="color: #2D7A4F;" />
              </div>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                class="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border outline-none transition-all"
                style="border-color: #d1d5db; color: #0f172a;"
                @focus="(e) => (e.target as HTMLElement).style.borderColor = '#2D7A4F'"
                @blur="(e) => (e.target as HTMLElement).style.borderColor = '#d1d5db'"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <UIcon
                  :name="showPassword ? 'i-heroicons-eye-slash-20-solid' : 'i-heroicons-eye-20-solid'"
                  class="w-5 h-5"
                />
              </button>
            </div>
          </div>

          <div v-if="errorMsg" class="rounded-lg px-4 py-3 text-sm font-medium" style="background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca;">
            {{ errorMsg }}
          </div>

          <div class="flex justify-end">
            <a href="#" class="text-xs font-medium" style="color: #C9A227;">Forgot password?</a>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity"
            :style="loading ? 'background-color: #2D7A4F; opacity: 0.7;' : 'background-color: #2D7A4F;'"
          >
            <UIcon v-if="loading" name="i-heroicons-arrow-path-20-solid" class="w-4 h-4 animate-spin" />
            <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
            <UIcon v-if="!loading" name="i-heroicons-arrow-right-20-solid" class="w-4 h-4" />
          </button>
        </form>

        <div class="mt-6 pt-5" style="border-top: 1px solid #f1f5f9;">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-md flex items-center justify-center" style="background-color: #C9A227;">
              <UIcon name="i-heroicons-shield-check-20-solid" class="w-3.5 h-3.5 text-white" />
            </div>
            <p class="text-xs" style="color: #94a3b8;">Secured by Shaken Baby Alliance IT</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
