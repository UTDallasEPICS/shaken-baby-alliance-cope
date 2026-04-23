
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

// ─── Types ───────────────────────────────────────────────────────────────────
interface AppSettings {
  smsProvider: string
  twilioAccountSid: string
  twilioAuthToken: string
  twilioPhoneNumber: string
  twilioMessagingServiceSid: string
  defaultResponseMessage: string
  systemActive: boolean
  chatbotEnabled: boolean
  aiEnabled: boolean
  aiProvider: string
  aiApiKey: string
  aiModel: string
  autoArchiveMessages: boolean
  autoArchiveDays: number
}

// ─── Static options (no string escaping issues in template) ──────────────────
const aiProviderOptions = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI GPT' },
]
const geminiModels = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Fastest)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast & efficient)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Most capable)' },
]
const openaiModels = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
  { value: 'gpt-4o', label: 'GPT-4o (Most capable)' },
]
const archiveDayOptions = [30, 60, 90, 180, 365]
const geminiKeyHint = 'Get your key at aistudio.google.com'
const openaiKeyHint = 'Get your key at platform.openai.com'
const geminiPlaceholder = 'AIzaSy...'
const openaiPlaceholder = 'sk-proj-...'

// ─── Toggle confirmation configs ──────────────────────────────────────────────
const toggleConfigs: Partial<Record<keyof AppSettings, {
  label: string
  onTitle: string
  onBody: string
  offTitle: string
  offBody: string
  destructiveOff: boolean
}>> = {
  systemActive: {
    label: 'System Active',
    onTitle: 'Re-enable the SMS System?',
    onBody: 'The system will begin receiving and responding to incoming messages from caregivers.',
    offTitle: 'Disable the SMS System?',
    offBody: 'This will STOP all automated SMS responses immediately. Caregivers who text in will receive no reply until the system is turned back on.',
    destructiveOff: true,
  },
  chatbotEnabled: {
    label: 'Chatbot Messages',
    onTitle: 'Enable Chatbot?',
    onBody: 'Keyword and workflow-based automated replies will be sent to caregivers.',
    offTitle: 'Disable Chatbot Messages?',
    offBody: 'Automated keyword/workflow replies will stop. Only AI responses (if enabled) will continue.',
    destructiveOff: true,
  },
  aiEnabled: {
    label: 'AI Automation',
    onTitle: 'Enable AI Automation?',
    onBody: 'AI will respond to messages that do not match any keyword or workflow. Make sure your API key is configured.',
    offTitle: 'Disable AI Automation?',
    offBody: 'AI-powered responses will be disabled. Only keyword and workflow chatbot replies will be sent.',
    destructiveOff: false,
  },
  autoArchiveMessages: {
    label: 'Auto-Archive',
    onTitle: 'Enable Auto-Archive?',
    onBody: 'Messages older than the configured number of days will be automatically archived.',
    offTitle: 'Disable Auto-Archive?',
    offBody: 'Messages will no longer be automatically archived and will accumulate indefinitely.',
    destructiveOff: false,
  },
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULTS: AppSettings = {
  smsProvider: 'twilio',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioPhoneNumber: '',
  twilioMessagingServiceSid: '',
  defaultResponseMessage: "Thank you for contacting the Shaken Baby Alliance COPE Support System. We're here to help.",
  systemActive: true,
  chatbotEnabled: true,
  aiEnabled: false,
  aiProvider: 'gemini',
  aiApiKey: '',
  aiModel: 'gemini-2.5-flash',
  autoArchiveMessages: true,
  autoArchiveDays: 90,
}

const editableKeys = Object.keys(DEFAULTS) as (keyof AppSettings)[]

function normalizeSettings(raw: Partial<AppSettings> | null | undefined): AppSettings {
  const normalized = { ...DEFAULTS }

  if (!raw) return normalized

  for (const key of editableKeys) {
    const fallback = DEFAULTS[key]
    const value = raw[key]

    if (typeof fallback === 'boolean') {
      ;(normalized[key] as boolean) = Boolean(value)
    } else if (typeof fallback === 'number') {
      const parsed = Number(value)
      ;(normalized[key] as number) = Number.isFinite(parsed) ? parsed : fallback
    } else {
      ;(normalized[key] as string) = typeof value === 'string' ? value : fallback
    }
  }

  if (normalized.smsProvider !== 'twilio') normalized.smsProvider = 'twilio'
  if (!['gemini', 'openai'].includes(normalized.aiProvider)) normalized.aiProvider = 'gemini'

  const models = normalized.aiProvider === 'gemini' ? geminiModels : openaiModels
  if (!models.some((model) => model.value === normalized.aiModel)) {
    normalized.aiModel = models[0].value
  }

  if (!archiveDayOptions.includes(normalized.autoArchiveDays)) {
    normalized.autoArchiveDays = 90
  }

  return normalized
}

// ─── State ───────────────────────────────────────────────────────────────────
const saved = ref<AppSettings>({ ...DEFAULTS })
const form = ref<AppSettings>({ ...DEFAULTS })
const loading = ref(true)
const saving = ref(false)
const showAuthToken = ref(false)
const showApiKey = ref(false)

const isDirty = computed(() => JSON.stringify(form.value) !== JSON.stringify(saved.value))
const charCount = computed(() => form.value.defaultResponseMessage.length)

const webhookCopied = ref(false)
const webhookUrl = computed(() => {
  if (typeof window === 'undefined') return '/api/messages/twilio-webhook'
  return `${window.location.origin}/api/messages/twilio-webhook`
})
async function copyWebhookUrl() {
  try {
    await navigator.clipboard.writeText(webhookUrl.value)
    webhookCopied.value = true
    setTimeout(() => { webhookCopied.value = false }, 2000)
  } catch {
    showToast('Could not copy — please copy manually', true)
  }
}
const currentModels = computed(() => form.value.aiProvider === 'gemini' ? geminiModels : openaiModels)
const apiKeyHint = computed(() => form.value.aiProvider === 'gemini' ? geminiKeyHint : openaiKeyHint)
const apiKeyPlaceholder = computed(() => form.value.aiProvider === 'gemini' ? geminiPlaceholder : openaiPlaceholder)

watch(() => form.value.aiProvider, (provider) => {
  const models = provider === 'gemini' ? geminiModels : openaiModels
  if (!models.some((model) => model.value === form.value.aiModel)) {
    form.value.aiModel = models[0].value
  }
})

// ─── Toast ───────────────────────────────────────────────────────────────────
const toast = ref({ show: false, message: '', isError: false })
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, isError = false) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message, isError }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3500)
}

// ─── Toggle confirm dialog ────────────────────────────────────────────────────
const confirm = ref({
  show: false,
  title: '',
  body: '',
  confirmLabel: '',
  isDestructive: false,
  field: null as keyof AppSettings | null,
  nextValue: false,
})

function requestToggle(field: keyof AppSettings) {
  const cfg = toggleConfigs[field]
  if (!cfg) return
  const current = form.value[field] as boolean
  const next = !current
  confirm.value = {
    show: true,
    title: next ? cfg.onTitle : cfg.offTitle,
    body: next ? cfg.onBody : cfg.offBody,
    confirmLabel: next ? 'Yes, enable' : 'Yes, disable',
    isDestructive: !next && cfg.destructiveOff,
    field,
    nextValue: next,
  }
}

function applyToggle() {
  if (confirm.value.field !== null) {
    (form.value[confirm.value.field] as boolean) = confirm.value.nextValue
  }
  confirm.value.show = false
}

function discardChanges() {
  form.value = { ...saved.value }
  showAuthToken.value = false
  showApiKey.value = false
  showToast('Unsaved changes discarded')
}

// ─── Navigation guard ────────────────────────────────────────────────────────
const navGuard = ref({ show: false, pendingPath: '' })
const bypassGuard = ref(false)
const router = useRouter()

onBeforeRouteLeave((to, _from, next) => {
  if (isDirty.value && !bypassGuard.value) {
    navGuard.value = { show: true, pendingPath: to.fullPath }
    next(false)
  } else {
    bypassGuard.value = false
    next()
  }
})

async function leaveWithoutSaving() {
  const path = navGuard.value.pendingPath
  navGuard.value = { show: false, pendingPath: '' }
  bypassGuard.value = true
  if (path) await router.push(path)
}

async function saveAndNavigate() {
  const path = navGuard.value.pendingPath
  navGuard.value = { show: false, pendingPath: '' }
  await doSave()
  if (!isDirty.value && path) {
    bypassGuard.value = true
    await router.push(path)
  }
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function loadSettings() {
  loading.value = true
  try {
    const data = await $fetch<Partial<AppSettings>>('/api/settings')
    const settings = normalizeSettings(data)
    saved.value = { ...settings }
    form.value = { ...settings }
  } catch {
    showToast('Failed to load settings', true)
  } finally {
    loading.value = false
  }
}

async function doSave() {
  if (saving.value) return
  saving.value = true
  try {
    const data = await $fetch<Partial<AppSettings>>('/api/settings', {
      method: 'POST',
      body: normalizeSettings(form.value),
    })
    const settings = normalizeSettings(data)
    saved.value = { ...settings }
    form.value = { ...settings }
    showToast('Settings saved successfully')
  } catch {
    showToast('Failed to save settings', true)
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="min-h-screen" style="background:#f8fafc;">

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center" style="min-height:70vh;">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style="border-color:#0f766e;border-top-color:transparent;" />
        <p class="text-sm" style="color:#64748b;">Loading settings…</p>
      </div>
    </div>

    <div v-else class="mx-auto px-4 py-6 sm:px-6 sm:py-8" style="max-width:880px;">

      <!-- Page Header -->
      <div class="flex flex-col items-stretch justify-between gap-4 mb-6 sm:flex-row sm:items-start">
        <div>
          <h1 class="text-2xl font-bold mb-1" style="color:#102a43;">Settings</h1>
          <p class="text-sm" style="color:#64748b;">Configure system preferences and integrations</p>
        </div>
        <button
          @click="doSave"
          :disabled="!isDirty || saving"
          class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          :class="isDirty && !saving
            ? 'bg-[#0f766e] text-white shadow-sm hover:bg-[#0d6560]'
            : 'bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed'"
        >
          <div v-if="saving" class="w-4 h-4 rounded-full border-2 border-white animate-spin" style="border-top-color:transparent;" />
          <UIcon v-else name="i-heroicons-cloud-arrow-up-20-solid" class="w-4 h-4" />
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
      </div>

      <!-- Unsaved changes banner -->
      <Transition name="sba-banner">
        <div
          v-if="isDirty"
          class="flex flex-col items-stretch justify-between gap-3 rounded-2xl px-5 py-3.5 mb-6 sm:flex-row sm:items-center sm:gap-4"
          style="background:rgba(245,158,11,0.08);border:1px solid #fcd34d;"
        >
          <div class="flex items-center gap-2.5">
            <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="w-5 h-5 flex-shrink-0" style="color:#b45309;" />
            <p class="text-sm font-medium" style="color:#92400e;">You have unsaved changes — save before leaving this page.</p>
          </div>
          <button
            @click="doSave"
            :disabled="saving"
            class="flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold text-white"
            style="background:#b45309;"
          >
            Save now
          </button>
          <button
            type="button"
            @click="discardChanges"
            :disabled="saving"
            class="flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold"
            style="background:#fff7ed;color:#92400e;border:1px solid #fed7aa;"
          >
            Discard
          </button>
        </div>
      </Transition>

      <!-- ── SMS Provider Settings ────────────────────────────────────────── -->
      <section class="rounded-2xl p-6 mb-4" style="background:#fff;box-shadow:0 1px 4px rgba(15,23,42,0.06);border:1px solid #f1f5f9;">
        <div class="flex items-center gap-3 mb-1">
          <div class="flex items-center justify-center w-8 h-8 rounded-xl" style="background:rgba(15,118,110,0.10);">
            <UIcon name="i-heroicons-device-phone-mobile-20-solid" class="w-4 h-4" style="color:#0f766e;" />
          </div>
          <h2 class="text-base font-bold" style="color:#102a43;">SMS Provider Settings</h2>
        </div>
        <p class="text-sm mb-6 ml-11" style="color:#64748b;">Configure your Twilio credentials — paste them directly from the Twilio Console</p>

        <div class="space-y-5">
          <!-- Provider -->
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:#374151;">SMS Provider</label>
            <div class="relative">
              <select
                v-model="form.smsProvider"
                class="w-full rounded-xl border px-4 py-2.5 text-sm appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                style="border-color:#e2e8f0;color:#102a43;background:#fff;"
              >
                <option value="twilio">Twilio</option>
              </select>
              <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color:#94a3b8;" />
            </div>
          </div>

          <!-- Account SID -->
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:#374151;">Account SID</label>
            <input
              v-model="form.twilioAccountSid"
              type="text"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              class="w-full rounded-xl border px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              style="border-color:#e2e8f0;color:#102a43;"
            />
            <p class="mt-1 text-xs" style="color:#94a3b8;">Starts with AC — copy from your Twilio Console dashboard</p>
          </div>

          <!-- Auth Token -->
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:#374151;">Auth Token</label>
            <div class="relative">
              <input
                v-model="form.twilioAuthToken"
                :type="showAuthToken ? 'text' : 'password'"
                placeholder="Your Twilio auth token"
                class="w-full rounded-xl border px-4 py-2.5 pr-20 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                style="border-color:#e2e8f0;color:#102a43;"
              />
              <button
                type="button"
                @click="showAuthToken = !showAuthToken"
                :aria-label="showAuthToken ? 'Hide Twilio auth token' : 'Show Twilio auth token'"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-1 rounded-lg"
                style="color:#0f766e;background:rgba(15,118,110,0.08);"
              >
                {{ showAuthToken ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p class="mt-1 text-xs" style="color:#dc2626;">Never share your auth token — store it securely</p>
          </div>

          <!-- Phone + Messaging SID -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:#374151;">Twilio Phone Number</label>
              <input
                v-model="form.twilioPhoneNumber"
                type="text"
                placeholder="+15550000000"
                class="w-full rounded-xl border px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                style="border-color:#e2e8f0;color:#102a43;"
              />
              <p class="mt-1 text-xs" style="color:#94a3b8;">E.164 format: +1XXXXXXXXXX</p>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:#374151;">
                Messaging Service SID
                <span class="font-normal ml-1" style="color:#94a3b8;">(optional)</span>
              </label>
              <input
                v-model="form.twilioMessagingServiceSid"
                type="text"
                placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                class="w-full rounded-xl border px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                style="border-color:#e2e8f0;color:#102a43;"
              />
              <p class="mt-1 text-xs" style="color:#94a3b8;">Starts with MG — leave blank to use phone number</p>
            </div>
          </div>

          <!-- Webhook URL -->
          <div class="rounded-xl p-4" style="background:#f0fdf9;border:1px solid #99f6e4;">
            <div class="flex items-center gap-2 mb-1.5">
              <UIcon name="i-heroicons-link-20-solid" class="w-4 h-4 flex-shrink-0" style="color:#0f766e;" />
              <span class="text-sm font-semibold" style="color:#0f766e;">Twilio Webhook URL</span>
            </div>
            <p class="text-xs mb-3 ml-6" style="color:#374151;">
              Paste this into <strong>Twilio Console → Phone Numbers → Configure → A message comes in</strong>.
              For WhatsApp, use <strong>Messaging → Try it out → Send a WhatsApp message → Sandbox settings</strong>.
            </p>
            <div class="flex items-center gap-2">
              <code
                class="flex-1 px-3 py-2 rounded-lg text-xs font-mono truncate select-all"
                style="background:#fff;border:1px solid #cbd5e1;color:#0f766e;"
              >{{ webhookUrl }}</code>
              <button
                type="button"
                @click="copyWebhookUrl"
                class="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                :style="webhookCopied ? 'background:#d1fae5;color:#047857;' : 'background:rgba(15,118,110,0.10);color:#0f766e;'"
              >
                <UIcon :name="webhookCopied ? 'i-heroicons-check-20-solid' : 'i-heroicons-clipboard-document-20-solid'" class="w-3.5 h-3.5" />
                {{ webhookCopied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Default Response Message ───────────────────────────────────────── -->
      <section class="rounded-2xl p-6 mb-4" style="background:#fff;box-shadow:0 1px 4px rgba(15,23,42,0.06);border:1px solid #f1f5f9;">
        <div class="flex items-center gap-3 mb-1">
          <div class="flex items-center justify-center w-8 h-8 rounded-xl" style="background:rgba(15,118,110,0.10);">
            <UIcon name="i-heroicons-chat-bubble-bottom-center-text-20-solid" class="w-4 h-4" style="color:#0f766e;" />
          </div>
          <h2 class="text-base font-bold" style="color:#102a43;">Default Response Message</h2>
        </div>
        <p class="text-sm mb-5 ml-11" style="color:#64748b;">Sent when no keyword or workflow matches an incoming message</p>

        <textarea
          v-model="form.defaultResponseMessage"
          rows="4"
          class="w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
          style="border-color:#e2e8f0;color:#102a43;"
          placeholder="Enter your default response message…"
        />
        <div class="flex items-center justify-between mt-2.5">
          <p class="text-xs" :style="charCount > 160 ? 'color:#dc2626;' : 'color:#94a3b8;'">
            {{ charCount }} / 160 characters
            <span v-if="charCount > 160" class="font-semibold ml-1">
              ({{ Math.ceil(charCount / 160) }} SMS segments — extra cost)
            </span>
          </p>
          <div class="h-1.5 rounded-full overflow-hidden" style="width:120px;background:#f1f5f9;">
            <div
              class="h-full rounded-full transition-all duration-300"
              :style="{
                width: Math.min(100, (charCount / 160) * 100) + '%',
                background: charCount > 160 ? '#dc2626' : charCount > 130 ? '#f59e0b' : '#0f766e'
              }"
            />
          </div>
        </div>
      </section>

      <!-- ── AI Integration ─────────────────────────────────────────────────── -->
      <section class="rounded-2xl p-6 mb-4" style="background:#fff;box-shadow:0 1px 4px rgba(15,23,42,0.06);border:1px solid #f1f5f9;">
        <div class="flex flex-col items-start justify-between gap-4 mb-5 sm:flex-row">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-8 h-8 rounded-xl" style="background:rgba(99,102,241,0.10);">
              <UIcon name="i-heroicons-sparkles-20-solid" class="w-4 h-4" style="color:#4f46e5;" />
            </div>
            <div>
              <h2 class="text-base font-bold" style="color:#102a43;">AI Automation</h2>
              <p class="text-xs mt-0.5" style="color:#64748b;">Use Gemini or OpenAI to power intelligent responses</p>
            </div>
          </div>
          <!-- AI Toggle -->
          <div class="flex items-center gap-2.5">
            <span class="text-xs font-semibold" :style="form.aiEnabled ? 'color:#4f46e5;' : 'color:#94a3b8;'">
              {{ form.aiEnabled ? 'Enabled' : 'Disabled' }}
            </span>
            <button
              type="button"
              role="switch"
              :aria-checked="form.aiEnabled"
              @click="requestToggle('aiEnabled')"
              :disabled="saving"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="form.aiEnabled ? 'bg-[#4f46e5]' : 'bg-[#cbd5e1]'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                :class="form.aiEnabled ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>

        <div
          class="space-y-5 transition-opacity duration-200"
          :class="form.aiEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none select-none'"
        >
          <!-- Provider -->
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:#374151;">AI Provider</label>
            <div class="relative">
              <select
                v-model="form.aiProvider"
                class="w-full rounded-xl border px-4 py-2.5 text-sm appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                style="border-color:#e2e8f0;color:#102a43;background:#fff;"
              >
                <option v-for="opt in aiProviderOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color:#94a3b8;" />
            </div>
          </div>

          <!-- API Key -->
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:#374151;">
              {{ form.aiProvider === 'gemini' ? 'Google AI API Key' : 'OpenAI API Key' }}
            </label>
            <div class="relative">
              <input
                v-model="form.aiApiKey"
                :type="showApiKey ? 'text' : 'password'"
                :placeholder="apiKeyPlaceholder"
                class="w-full rounded-xl border px-4 py-2.5 pr-20 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                style="border-color:#e2e8f0;color:#102a43;"
              />
              <button
                type="button"
                @click="showApiKey = !showApiKey"
                :aria-label="showApiKey ? 'Hide AI API key' : 'Show AI API key'"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-1 rounded-lg"
                style="color:#4f46e5;background:rgba(99,102,241,0.08);"
              >
                {{ showApiKey ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p class="mt-1 text-xs" style="color:#94a3b8;">{{ apiKeyHint }}</p>
          </div>

          <!-- Model -->
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:#374151;">AI Model</label>
            <div class="relative">
              <select
                v-model="form.aiModel"
                class="w-full rounded-xl border px-4 py-2.5 text-sm appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                style="border-color:#e2e8f0;color:#102a43;background:#fff;"
              >
                <option v-for="m in currentModels" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
              <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color:#94a3b8;" />
            </div>
          </div>
        </div>

        <div v-if="!form.aiEnabled" class="mt-5 rounded-xl p-4" style="background:#f8fafc;border:1px solid #e2e8f0;">
          <p class="text-sm" style="color:#64748b;">
            AI automation is disabled. Enable it above to let Gemini or OpenAI answer messages that fall outside your keyword and workflow configurations.
          </p>
        </div>
      </section>

      <!-- ── System Settings ────────────────────────────────────────────────── -->
      <section class="rounded-2xl p-6 mb-4" style="background:#fff;box-shadow:0 1px 4px rgba(15,23,42,0.06);border:1px solid #f1f5f9;">
        <div class="flex items-center gap-3 mb-5">
          <div class="flex items-center justify-center w-8 h-8 rounded-xl" style="background:rgba(15,118,110,0.10);">
            <UIcon name="i-heroicons-shield-check-20-solid" class="w-4 h-4" style="color:#0f766e;" />
          </div>
          <div>
            <h2 class="text-base font-bold" style="color:#102a43;">System Settings</h2>
            <p class="text-xs mt-0.5" style="color:#64748b;">Control overall system operation and response modes</p>
          </div>
        </div>

        <!-- System Active row -->
        <div class="flex items-start justify-between gap-4 py-4" style="border-bottom:1px solid #f1f5f9;">
          <div>
            <p class="text-sm font-semibold" style="color:#102a43;">System Active</p>
            <p class="text-xs mt-0.5" style="color:#64748b;">Enable or disable the entire SMS response system</p>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="text-xs font-semibold" :style="form.systemActive ? 'color:#0f766e;' : 'color:#dc2626;'">
              {{ form.systemActive ? 'Active' : 'Inactive' }}
            </span>
            <button
              type="button"
              role="switch"
              :aria-checked="form.systemActive"
              @click="requestToggle('systemActive')"
              :disabled="saving"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:ring-offset-2"
              :class="form.systemActive ? 'bg-[#0f766e]' : 'bg-[#cbd5e1]'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                :class="form.systemActive ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>

        <!-- Chatbot row -->
        <div class="flex items-start justify-between gap-4 py-4" style="border-bottom:1px solid #f1f5f9;">
          <div>
            <p class="text-sm font-semibold" style="color:#102a43;">Chatbot Messages</p>
            <p class="text-xs mt-0.5" style="color:#64748b;">Enable keyword and workflow-based automated responses</p>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="text-xs font-semibold" :style="form.chatbotEnabled ? 'color:#0f766e;' : 'color:#94a3b8;'">
              {{ form.chatbotEnabled ? 'Enabled' : 'Disabled' }}
            </span>
            <button
              type="button"
              role="switch"
              :aria-checked="form.chatbotEnabled"
              @click="requestToggle('chatbotEnabled')"
              :disabled="saving"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:ring-offset-2"
              :class="form.chatbotEnabled ? 'bg-[#0f766e]' : 'bg-[#cbd5e1]'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                :class="form.chatbotEnabled ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>

        <!-- Status indicator -->
        <div
          class="mt-4 rounded-xl px-4 py-3.5 flex items-center gap-3"
          :style="form.systemActive
            ? 'background:rgba(15,118,110,0.06);border:1px solid #a7f3d0;'
            : 'background:rgba(220,38,38,0.06);border:1px solid #fca5a5;'"
        >
          <div
            class="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
            :class="form.systemActive ? 'bg-[#0f766e]' : 'bg-red-500'"
          />
          <p class="text-sm font-medium" :style="form.systemActive ? 'color:#065f46;' : 'color:#b91c1c;'">
            {{ form.systemActive
              ? 'System is active and responding to caregivers'
              : 'System is INACTIVE — no automated responses will be sent' }}
          </p>
        </div>
      </section>

      <!-- ── Program Settings ───────────────────────────────────────────────── -->
      <section class="rounded-2xl p-6 mb-8" style="background:#fff;box-shadow:0 1px 4px rgba(15,23,42,0.06);border:1px solid #f1f5f9;">
        <div class="flex items-center gap-3 mb-5">
          <div class="flex items-center justify-center w-8 h-8 rounded-xl" style="background:rgba(15,118,110,0.10);">
            <UIcon name="i-heroicons-cog-6-tooth-20-solid" class="w-4 h-4" style="color:#0f766e;" />
          </div>
          <div>
            <h2 class="text-base font-bold" style="color:#102a43;">Program Settings</h2>
            <p class="text-xs mt-0.5" style="color:#64748b;">Data retention and program-specific options</p>
          </div>
        </div>

        <!-- Auto-archive toggle -->
        <div class="flex items-start justify-between gap-4 mb-5">
          <div>
            <p class="text-sm font-semibold" style="color:#102a43;">Auto-Archive Messages</p>
            <p class="text-xs mt-0.5" style="color:#64748b;">Automatically archive old messages to keep the system clean</p>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="text-xs font-semibold" :style="form.autoArchiveMessages ? 'color:#0f766e;' : 'color:#94a3b8;'">
              {{ form.autoArchiveMessages ? 'On' : 'Off' }}
            </span>
            <button
              type="button"
              role="switch"
              :aria-checked="form.autoArchiveMessages"
              @click="requestToggle('autoArchiveMessages')"
              :disabled="saving"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:ring-offset-2"
              :class="form.autoArchiveMessages ? 'bg-[#0f766e]' : 'bg-[#cbd5e1]'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                :class="form.autoArchiveMessages ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>

        <!-- Archive days -->
        <Transition name="sba-banner">
          <div v-if="form.autoArchiveMessages">
            <label class="block text-sm font-medium mb-1.5" style="color:#374151;">Archive messages older than</label>
            <div class="relative" style="max-width:200px;">
              <select
                v-model.number="form.autoArchiveDays"
                class="w-full rounded-xl border px-4 py-2.5 text-sm appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                style="border-color:#e2e8f0;color:#102a43;background:#fff;"
              >
                <option v-for="d in archiveDayOptions" :key="d" :value="d">{{ d }} days</option>
              </select>
              <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color:#94a3b8;" />
            </div>
          </div>
        </Transition>
      </section>

    </div><!-- end max-width wrapper -->

    <!-- ══ Toggle Confirmation Modal ══════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="sba-overlay">
        <div
          v-if="confirm.show"
          class="fixed inset-0 flex items-center justify-center z-[300] px-4"
          style="background:rgba(15,23,42,0.5);backdrop-filter:blur(4px);"
          @click.self="confirm.show = false"
        >
          <Transition name="sba-pop">
            <div
              v-if="confirm.show"
              class="rounded-2xl p-6 shadow-2xl w-full"
              style="max-width:440px;background:#fff;"
            >
              <div class="flex items-start gap-4 mb-5">
                <div
                  class="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                  :style="confirm.isDestructive
                    ? 'background:rgba(220,38,38,0.10);'
                    : 'background:rgba(15,118,110,0.10);'"
                >
                  <UIcon
                    :name="confirm.isDestructive ? 'i-heroicons-exclamation-triangle-20-solid' : 'i-heroicons-information-circle-20-solid'"
                    class="w-5 h-5"
                    :style="confirm.isDestructive ? 'color:#dc2626;' : 'color:#0f766e;'"
                  />
                </div>
                <div>
                  <h3 class="text-base font-bold mb-1.5" style="color:#102a43;">{{ confirm.title }}</h3>
                  <p class="text-sm leading-relaxed" style="color:#475569;">{{ confirm.body }}</p>
                </div>
              </div>
              <div class="flex gap-3 justify-end">
                <button
                  @click="confirm.show = false"
                  class="px-4 py-2 rounded-xl text-sm font-medium"
                  style="background:#f1f5f9;color:#475569;"
                >
                  Cancel
                </button>
                <button
                  @click="applyToggle"
                  class="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  :style="confirm.isDestructive ? 'background:#dc2626;' : 'background:#0f766e;'"
                >
                  {{ confirm.confirmLabel }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ Navigation Guard Modal ═════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="sba-overlay">
        <div
          v-if="navGuard.show"
          class="fixed inset-0 flex items-center justify-center z-[300] px-4"
          style="background:rgba(15,23,42,0.5);backdrop-filter:blur(4px);"
        >
          <div class="rounded-2xl p-6 shadow-2xl w-full" style="max-width:460px;background:#fff;">
            <div class="flex items-start gap-4 mb-5">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style="background:rgba(245,158,11,0.12);">
                <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="w-5 h-5" style="color:#b45309;" />
              </div>
              <div>
                <h3 class="text-base font-bold mb-1.5" style="color:#102a43;">Unsaved Changes</h3>
                <p class="text-sm leading-relaxed" style="color:#475569;">
                  You have changes that haven't been saved yet. Would you like to save them before leaving?
                </p>
              </div>
            </div>
            <div class="flex gap-3 justify-end flex-wrap">
              <button
                @click="navGuard.show = false"
                class="px-4 py-2 rounded-xl text-sm font-medium"
                style="background:#f1f5f9;color:#475569;"
              >
                Stay on page
              </button>
              <button
                @click="leaveWithoutSaving"
                class="px-4 py-2 rounded-xl text-sm font-medium"
                style="background:#fee2e2;color:#dc2626;"
              >
                Leave without saving
              </button>
              <button
                @click="saveAndNavigate"
                class="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style="background:#0f766e;"
              >
                Save and leave
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ Toast ══════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="sba-toast">
        <div
          v-if="toast.show"
          class="fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl z-[400]"
          :style="toast.isError
            ? 'background:#1e1e2e;border:1px solid #dc2626;'
            : 'background:#1e1e2e;border:1px solid #0f766e;'"
        >
          <UIcon
            :name="toast.isError ? 'i-heroicons-x-circle-20-solid' : 'i-heroicons-check-circle-20-solid'"
            class="w-5 h-5 flex-shrink-0"
            :style="toast.isError ? 'color:#f87171;' : 'color:#34d399;'"
          />
          <p class="text-sm font-medium" style="color:#f8fafc;">{{ toast.message }}</p>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.sba-banner-enter-active, .sba-banner-leave-active { transition: all 0.25s ease; }
.sba-banner-enter-from, .sba-banner-leave-to { opacity: 0; transform: translateY(-6px); }

.sba-overlay-enter-active, .sba-overlay-leave-active { transition: opacity 0.2s ease; }
.sba-overlay-enter-from, .sba-overlay-leave-to { opacity: 0; }

.sba-pop-enter-active, .sba-pop-leave-active { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.sba-pop-enter-from, .sba-pop-leave-to { opacity: 0; transform: scale(0.93) translateY(8px); }

.sba-toast-enter-active, .sba-toast-leave-active { transition: all 0.3s ease; }
.sba-toast-enter-from, .sba-toast-leave-to { opacity: 0; transform: translateY(14px); }
</style>
