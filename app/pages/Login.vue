
<script setup lang="ts">

import { ref } from 'vue'
import { authClient } from '~/utils/auth-client'

const router = useRouter();
// Swapped 'Mail' for 'User' icon

// get a request to make the validation check
// Form state
const userId = ref('') // Changed from email to userId
const password = ref('')


const handleLogout = async() => {
  try{
  const {data, error} = await authClient.signOut()
    console.log('Logged out!')
    router.push('/') 
}
catch(err){
  console.error('An unexpected error occurred:', err)
}
}
// Handle submission
const handleSubmit = async () => {
try {
    
 /*  const {data,error} = await authClient.signUp.email({
    email: 'phuctrinh1006@gmail.com',
    password: '123456789',
    name:'testuser'
  }) */
 /*    const { data, error } = await authClient.signIn.username({
      username: userId.value,
      password: password.value, 
    }) */

    const { data, error } = await authClient.signIn.email({
      email: userId.value,
      password: password.value, 
    }) 
    if (error) {
      console.error(error.message)
      console.log('Invalid User ID or Password')
      return
    }
    
    console.log('Login successful!')
    
   
    if ((data.user as any).role === 'admin') {
      console.log('Welcome Admin! Routing to admin panel...')
      router.push('/');
      
    } else {
      console.log('Welcome User! Routing to standard dashboard...')
  router.push('/dashboard.vue');
    }

  } catch (err) {
    console.error('An unexpected error occurred:', err)
  }


  console.log('Submitting:', { 
    username: userId.value, 
    password: password.value, 
   
  })
}
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden bg-gray-50">
  <div class="min-h-screen bg-gradient-to-br from-blue-50/50 to-slate-100 flex items-center justify-center p-4">
    
    <div class="bg-white w-full max-w-[420px] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
      
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
          <Heart class="w-5 h-5 text-white" />
        </div>
        <h1 class="text-xl font-bold text-gray-900 tracking-tight">Shaken Baby Alliance</h1>
      </div>

      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
        <p class="text-sm text-gray-500">Enter your credentials to access your dashboard</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-gray-700">User ID</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User class="h-4 w-4 text-blue-500" />
            </div>
            <input 
              v-model="userId"
              type="text" 
              placeholder="Enter your User ID"
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors placeholder:text-gray-400"
              required
            >
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-gray-700">Password</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock class="h-4 w-4 text-blue-500" />
            </div>
            <input 
              v-model="password"
              type="password" 
              placeholder="••••••••"
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors placeholder:text-gray-400"
              required
            >
          </div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <label class="flex items-center gap-2 cursor-pointer group">
            <div class="relative flex items-center justify-center">
             
              <svg class="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
                <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
           
          </label>
          
          <a href="#" class="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
            Forgot password?
          </a>
        </div>

        <button 
          type="submit"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
        >
          Log In
          <ArrowRight class="w-4 h-4" />
        </button>

      </form>
    </div>
  </div>
  </div>
</template>