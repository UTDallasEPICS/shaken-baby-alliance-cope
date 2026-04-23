<script setup lang="ts">
definePageMeta({ layout: false })

import { ref } from 'vue'
import { authClient } from '~/utils/auth-client'

const userId = ref('')
const password = ref('')
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
    
    console.log('Login successful!')
    
   
    if ((data.user as any).role === 'admin') {
      console.log('Welcome Admin! Routing to admin panel...')
      router.push('/dashboard');
      
    } else {
      console.log('Welcome User! Routing to standard dashboard...')
      router.push('/dashboard');
    }

  } catch (err) {
    errorMsg.value = 'An unexpected error occurred.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex" style="background: linear-gradient(135deg, #1B3A5C 0%, #0F2438 60%, #1B3A5C 100%);">
    <!-- Left branding panel (hidden on small screens) -->
    <div class="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: #C9A227;">
          <UIcon name="i-heroicons-shield-check-20-solid" class="w-6 h-6 text-white" />
        </div>
        <span class="text-white font-bold text-xl">Shaken Baby Alliance</span>
      </div>

      <div>
        <h1 class="text-4xl font-bold text-white leading-tight mb-4">
          Supporting families,<br />
          <span style="color: #C9A227;">one message at a time.</span>
        </h1>
        <p class="text-base" style="color: rgba(255,255,255,0.6);">
          The COPE SMS Admin Portal helps you monitor caregiver outreach, manage workflows, and track every interaction securely.
        </p>

        <div class="mt-10 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: rgba(45,122,79,0.3);">
              <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" class="w-4 h-4" style="color: #3B8A5E;" />
            </div>
            <span class="text-sm" style="color: rgba(255,255,255,0.7);">Real-time SMS caregiver messaging</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: rgba(45,122,79,0.3);">
              <UIcon name="i-heroicons-arrow-path-20-solid" class="w-4 h-4" style="color: #3B8A5E;" />
            </div>
            <span class="text-sm" style="color: rgba(255,255,255,0.7);">Automated response workflows</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: rgba(45,122,79,0.3);">
              <UIcon name="i-heroicons-shield-check-20-solid" class="w-4 h-4" style="color: #3B8A5E;" />
            </div>
            <span class="text-sm" style="color: rgba(255,255,255,0.7);">Secure, role-based access control</span>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-gray-700">Email</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User class="h-4 w-4 text-blue-500" />
            </div>
            <input 
              v-model="userId"
              type="email" 
              placeholder="Enter your email"
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors placeholder:text-gray-400"
              required
            >
          </div>
          <span class="font-bold text-lg" style="color: #1B3A5C;">Shaken Baby Alliance</span>
        </div>

        <div class="mb-7">
          <h2 class="text-2xl font-bold mb-1" style="color: #1B3A5C;">Welcome back</h2>
          <p class="text-sm" style="color: #64748b;">Sign in to access the COPE SMS Admin Portal</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color: #1B3A5C;">Email Address</label>
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
                style="border-color: #e2e8f0; color: #1e293b;"
                @focus="(e) => (e.target as HTMLElement).style.borderColor = '#2D7A4F'"
                @blur="(e) => (e.target as HTMLElement).style.borderColor = '#e2e8f0'"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color: #1B3A5C;">Password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <UIcon name="i-heroicons-lock-closed-20-solid" class="w-4 h-4" style="color: #2D7A4F;" />
              </div>
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                required
                class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all"
                style="border-color: #e2e8f0; color: #1e293b;"
                @focus="(e) => (e.target as HTMLElement).style.borderColor = '#2D7A4F'"
                @blur="(e) => (e.target as HTMLElement).style.borderColor = '#e2e8f0'"
              />
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
            <span>{{ loading ? 'Signing in…' : 'Sign In' }}</span>
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
