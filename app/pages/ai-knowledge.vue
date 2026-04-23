<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'

type Category = 'Safety' | 'Crying' | 'Emergency' | 'Parenting' | 'Organization' | 'Other'
type ActiveTab = 'knowledge' | 'prompt' | 'test' | 'settings'

interface KnowledgeEntry {
  id: string
  title: string
  category: Category
  content: string
  active: boolean
  updatedAt: string | Date
}

interface TestChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  matched?: string[]
  error?: string | null
  provider?: string | null
  model?: string | null
  isFallback?: boolean
}

const activeTab = ref<ActiveTab>('knowledge')
const aiEnabled = ref(false)
const search = ref('')
const categoryFilter = ref<'All' | Category>('All')
const showModal = ref(false)
const editingEntry = ref<KnowledgeEntry | null>(null)
const testMessage = ref('')
const testResponse = ref<string | null>(null)
const testMatched = ref<string[]>([])
const testLoading = ref(false)
const testChatMessages = ref<TestChatMessage[]>([])
const testChatScroll = ref<HTMLElement | null>(null)
const loadingEntries = ref(true)
const savingEntries = ref(false)

const systemPrompt = ref(
  "You are a compassionate support assistant for the Shaken Baby Alliance COPE program. Always prioritize baby safety. If there is immediate danger, direct to 911 or 988 immediately. Keep replies short and clear for SMS (under 3 sentences). Respond in the caregiver's language (English or Spanish). Never provide medical diagnoses."
)

const selectedModel = ref('gemini-2.0-flash-lite')
const responseStyle = ref<'concise' | 'balanced' | 'detailed'>('balanced')
const fallbackBehavior = ref<'menu' | 'message'>('menu')
const emergencyOverride = ref(true)

const categories: Category[] = ['Safety', 'Crying', 'Emergency', 'Parenting', 'Organization', 'Other']

const categoryStyle: Record<Category, { bg: string; color: string; border: string }> = {
  Safety:       { bg: 'rgba(220,38,38,0.10)',   color: '#b91c1c', border: '#fca5a5' },
  Crying:       { bg: 'rgba(245,158,11,0.10)',   color: '#b45309', border: '#fcd34d' },
  Emergency:    { bg: 'rgba(220,38,38,0.10)',   color: '#b91c1c', border: '#fca5a5' },
  Parenting:    { bg: 'rgba(15,118,110,0.10)',  color: '#0f766e', border: '#6ee7b7' },
  Organization: { bg: 'rgba(99,102,241,0.10)',  color: '#4f46e5', border: '#a5b4fc' },
  Other:        { bg: 'rgba(100,116,139,0.10)', color: '#475569', border: '#cbd5e1' },
}

const formData = ref({ title: '', category: 'Safety' as Category, content: '', active: true })

const entries = ref<KnowledgeEntry[]>([])
/*
  { id: 1, title: 'Never shake a baby', category: 'Safety', content: 'Shaking causes abusive head trauma (AHT). Even gentle shaking can cause permanent brain damage or death. Always put baby down in a safe place instead.', active: true, updatedAt: '2026-04-20' },
  { id: 2, title: 'Safe sleep rules', category: 'Safety', content: 'Always place baby on their back on a firm, flat surface. Keep the sleep area free of pillows, blankets, bumpers, and toys. Baby should sleep alone in their crib.', active: true, updatedAt: '2026-04-20' },
  { id: 3, title: 'Baby won\'t stop crying — steps', category: 'Crying', content: 'Check feeding, diaper, and sleep. Try rocking gently, white noise, or swaddling. If overwhelmed, put baby in a safe place and step away briefly. The crying will stop.', active: true, updatedAt: '2026-04-19' },
  { id: 4, title: 'I feel overwhelmed — what to do', category: 'Parenting', content: 'Put baby in a safe place like a crib. Step away and take 10 slow breaths. Call or text 988 for support. It is okay to ask for help — you are doing your best.', active: true, updatedAt: '2026-04-19' },
  { id: 5, title: 'Emergency contacts', category: 'Emergency', content: 'Call 911 for immediate danger. Call or text 988 for mental health crisis. You are not alone and help is available 24/7.', active: true, updatedAt: '2026-04-18' },
  { id: 6, title: 'Who we are — Shaken Baby Alliance', category: 'Organization', content: 'Shaken Baby Alliance COPE program provides bilingual SMS-based support to caregivers. We offer parenting guidance, emotional support, and crisis resources in English and Spanish.', active: true, updatedAt: '2026-04-18' },
  { id: 7, title: 'Feeding tips for newborns', category: 'Parenting', content: 'Feed newborns every 2-3 hours or on demand. Burp gently after feeding. If breastfeeding is difficult, contact a lactation consultant. Formula is a healthy alternative.', active: false, updatedAt: '2026-04-15' },
  { id: 8, title: 'Angry caregiver — immediate steps', category: 'Emergency', content: 'Put the baby in the crib right now and walk to another room. Do not pick them up until you feel calmer. Feeling angry is normal — acting on it is not. Call 988 if needed.', active: true, updatedAt: '2026-04-17' },
*/

const filteredEntries = computed(() => {
  let list = entries.value
  if (categoryFilter.value !== 'All') list = list.filter(e => e.category === categoryFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(e => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q))
  }
  return list
})

const activeCount = computed(() => entries.value.filter(e => e.active).length)

function formatDate(value: string | Date) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10)
}

async function loadEntries() {
  loadingEntries.value = true
  try {
    const data = await $fetch<{ entries: KnowledgeEntry[] }>('/api/ai-knowledge')
    entries.value = data.entries || []
  } finally {
    loadingEntries.value = false
  }
}

function openAdd() {
  formData.value = { title: '', category: 'Safety', content: '', active: true }
  editingEntry.value = null
  showModal.value = true
}

function openEdit(entry: KnowledgeEntry) {
  formData.value = { title: entry.title, category: entry.category, content: entry.content, active: entry.active }
  editingEntry.value = entry
  showModal.value = true
}

async function saveEntry() {
  if (!formData.value.title.trim() || !formData.value.content.trim()) return
  savingEntries.value = true
  try {
    if (editingEntry.value) {
      const { entry } = await $fetch<{ entry: KnowledgeEntry }>('/api/ai-knowledge', {
        method: 'PUT',
        body: { id: editingEntry.value.id, ...formData.value },
      })
      const idx = entries.value.findIndex(e => e.id === editingEntry.value!.id)
      if (idx >= 0) entries.value[idx] = entry
    } else {
      const { entry } = await $fetch<{ entry: KnowledgeEntry }>('/api/ai-knowledge', {
        method: 'POST',
        body: formData.value,
      })
      entries.value.unshift(entry)
    }
    showModal.value = false
  } finally {
    savingEntries.value = false
  }
}

async function deleteEntry(id: string) {
  await $fetch('/api/ai-knowledge', {
    method: 'DELETE',
    body: { id },
  })
  entries.value = entries.value.filter(e => e.id !== id)
}

async function toggleActive(entry: KnowledgeEntry) {
  const next = !entry.active
  entry.active = next
  try {
    const { entry: saved } = await $fetch<{ entry: KnowledgeEntry }>('/api/ai-knowledge', {
      method: 'PUT',
      body: { ...entry, active: next },
    })
    const idx = entries.value.findIndex(e => e.id === saved.id)
    if (idx >= 0) entries.value[idx] = saved
  } catch (error) {
    entry.active = !next
    throw error
  }
}

async function runTest() {
  if (!testMessage.value.trim()) return
  const userText = testMessage.value.trim()
  testChatMessages.value.push({
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'user',
    text: userText,
  })
  await nextTick()
  scrollTestChatToBottom()
  testMessage.value = ''
  testLoading.value = true
  testResponse.value = null
  testMatched.value = []
  try {
    const result = await $fetch<{
      fallbackResponse: string
      generatedResponse?: string
      emergency: { isEmergency: boolean }
      matches: Array<{ title: string; score: number }>
      provider?: string
      model?: string
      aiError?: string
      embeddingError?: string
    }>('/api/ai-test', {
      method: 'POST',
      body: { messageText: userText, generate: true, vector: true, model: selectedModel.value },
    })

    const responseText = result.generatedResponse || result.fallbackResponse
    const usedGemini = !!result.provider && !result.aiError
    testResponse.value = responseText
    testMatched.value = result.matches.map((match) => `${match.title} (${match.score.toFixed(1)})`)
    if (result.emergency.isEmergency) {
      testMatched.value.unshift('Emergency override')
    }
    testChatMessages.value.push({
      id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: 'assistant',
      text: responseText,
      matched: [...testMatched.value],
      provider: result.provider ?? null,
      model: result.model ?? null,
      isFallback: !usedGemini,
      error: result.aiError ?? result.embeddingError ?? null,
    })
    await nextTick()
    scrollTestChatToBottom()
  } finally {
    testLoading.value = false
  }
  return
  setTimeout(() => {
    testLoading.value = false
    testResponse.value = "It's okay to feel that way — put the baby in a safe place like a crib and step away for a few minutes. Take 10 slow deep breaths. You are not alone. If you need someone to talk to, call or text 988."
    testMatched.value = ["Baby won't stop crying — steps", "I feel overwhelmed — what to do", "Emergency contacts"]
  }, 1200)
}

function scrollTestChatToBottom() {
  if (!testChatScroll.value) return
  testChatScroll.value.scrollTop = testChatScroll.value.scrollHeight
}

function clearTestChat() {
  testChatMessages.value = []
  testMessage.value = ''
  testResponse.value = null
  testMatched.value = []
}

const tabs: { key: ActiveTab; label: string; icon: string }[] = [
  { key: 'knowledge', label: 'Knowledge Base', icon: 'i-heroicons-book-open-20-solid' },
  { key: 'prompt',    label: 'System Prompt',  icon: 'i-heroicons-cpu-chip-20-solid' },
  { key: 'test',      label: 'Test Panel',     icon: 'i-heroicons-beaker-20-solid' },
  { key: 'settings',  label: 'Settings',       icon: 'i-heroicons-adjustments-horizontal-20-solid' },
]

// ── Preview mode ──
const showPreview = ref(false)
const expandedRows = ref<string[]>([])
const previewEdits = ref<Record<string, { title: string; content: string }>>({})
const saveToast = ref(false)
const previewNewMode = ref(false)
const previewNewForm = ref({ title: '', category: 'Safety' as Category, content: '', active: true })

function openPreview() {
  previewEdits.value = {}
  entries.value.forEach(e => {
    previewEdits.value[e.id] = { title: e.title, content: e.content }
  })
  expandedRows.value = []
  previewNewMode.value = false
  showPreview.value = true
}

function isExpanded(id: string) {
  return expandedRows.value.includes(id)
}

function toggleRow(id: string) {
  const idx = expandedRows.value.indexOf(id)
  if (idx >= 0) expandedRows.value.splice(idx, 1)
  else expandedRows.value.push(id)
}

function expandAll() {
  expandedRows.value = entries.value.map(e => e.id)
}

function collapseAll() {
  expandedRows.value = []
}

async function saveAllPreview() {
  savingEntries.value = true
  try {
    const updatedEntries = await Promise.all(entries.value.map(async (entry) => {
      const edit = previewEdits.value[entry.id]
      if (!edit) return entry

      const { entry: saved } = await $fetch<{ entry: KnowledgeEntry }>('/api/ai-knowledge', {
        method: 'PUT',
        body: {
          ...entry,
          title: edit.title,
          content: edit.content,
        },
      })
      return saved
    }))

    entries.value = updatedEntries

    if (previewNewMode.value && previewNewForm.value.title.trim() && previewNewForm.value.content.trim()) {
      const { entry } = await $fetch<{ entry: KnowledgeEntry }>('/api/ai-knowledge', {
        method: 'POST',
        body: previewNewForm.value,
      })
      entries.value.push(entry)
      previewNewMode.value = false
      previewNewForm.value = { title: '', category: 'Safety', content: '', active: true }
    }

    saveToast.value = true
    setTimeout(() => { saveToast.value = false }, 3000)
  } finally {
    savingEntries.value = false
  }
}

const fallbackOptions = [
  { value: 'menu',    label: 'Show Main Menu', desc: 'Return caregiver to the numbered menu.' },
  { value: 'message', label: 'Send a message', desc: "Reply: \"I'm not sure — reply HELP for options.\"" },
]

const promptTips = [
  { icon: 'i-heroicons-language-20-solid', color: '#4f46e5', bg: 'rgba(99,102,241,0.10)', title: 'Language', body: "Tell the AI to respond in the caregiver's language — English or Spanish." },
  { icon: 'i-heroicons-heart-20-solid', color: '#dc2626', bg: 'rgba(220,38,38,0.10)', title: 'Tone', body: 'Keep the tone warm, non-judgmental, and supportive — never clinical.' },
  { icon: 'i-heroicons-exclamation-triangle-20-solid', color: '#b45309', bg: 'rgba(245,158,11,0.10)', title: 'Safety Rules', body: 'Always escalate to 911 or 988 when danger is detected.' },
]

onMounted(loadEntries)
</script>

<template>
  <div class="max-w-[1400px] mx-auto p-6 space-y-6">

    <!-- Page Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl" style="background:rgba(99,102,241,0.12);">
            <UIcon name="i-heroicons-sparkles-20-solid" style="width:20px;height:20px;color:#4f46e5;" />
          </div>
          <h1 class="text-3xl font-semibold tracking-tight text-[#102a43]">AI Knowledge Base</h1>
        </div>
        <p class="mt-2 text-base text-[#64748b]">Manage what the AI knows and configure how it responds to caregivers</p>
      </div>

      <!-- Controls -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- AI Mode Toggle -->
        <div
          class="flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition-all duration-200"
          :style="aiEnabled ? 'background:#f0fdf8;border-color:#bbf7e0;' : 'background:#f8fbff;border-color:#e7edf3;'"
        >
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide" :style="aiEnabled ? 'color:#0f766e;' : 'color:#94a3b8;'">AI Mode</p>
            <p class="text-sm font-bold" :style="aiEnabled ? 'color:#0f766e;' : 'color:#475569;'">{{ aiEnabled ? 'Enabled' : 'Disabled' }}</p>
          </div>
          <button
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none"
            :style="aiEnabled ? 'background:#0f766e;' : 'background:#cbd5e1;'"
            @click="aiEnabled = !aiEnabled"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
              :style="aiEnabled ? 'transform:translateX(22px);' : 'transform:translateX(2px);'"
            />
          </button>
        </div>

        <!-- Model Selector -->
        <div class="flex items-center gap-2 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 py-2.5">
          <UIcon name="i-heroicons-cpu-chip-20-solid" style="width:15px;height:15px;color:#4f46e5;" />
          <select
            v-model="selectedModel"
            class="bg-transparent text-sm font-medium text-[#102a43] outline-none cursor-pointer"
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          </select>
        </div>

        <button
          class="flex items-center gap-2 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-5 py-2.5 text-sm font-semibold text-[#475569] shadow-sm transition hover:bg-[#f1f5f9]"
          @click="openPreview"
        >
          <UIcon name="i-heroicons-eye-20-solid" style="width:16px;height:16px;" />
          Preview
        </button>

        <button
          class="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          style="background:#0f766e;"
          :disabled="savingEntries"
          @click="openAdd"
        >
          <UIcon name="i-heroicons-plus-20-solid" style="width:16px;height:16px;" />
          Add Entry
        </button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-2xl border border-[#e7edf3] bg-white p-4 shadow-sm">
        <p class="text-xs font-medium text-[#64748b]">Total Entries</p>
        <p class="mt-1 text-2xl font-bold text-[#102a43]">{{ entries.length }}</p>
      </div>
      <div class="rounded-2xl border border-[#e7edf3] bg-white p-4 shadow-sm">
        <p class="text-xs font-medium text-[#64748b]">Active</p>
        <p class="mt-1 text-2xl font-bold text-[#0f766e]">{{ activeCount }}</p>
      </div>
      <div class="rounded-2xl border border-[#e7edf3] bg-white p-4 shadow-sm">
        <p class="text-xs font-medium text-[#64748b]">Categories</p>
        <p class="mt-1 text-2xl font-bold text-[#102a43]">{{ categories.length }}</p>
      </div>
      <div
        class="rounded-2xl border p-4 shadow-sm"
        :style="aiEnabled ? 'background:#f0fdf8;border-color:#bbf7e0;' : 'background:#fff;border-color:#e7edf3;'"
      >
        <p class="text-xs font-medium text-[#64748b]">AI Status</p>
        <p class="mt-1 text-sm font-bold" :style="aiEnabled ? 'color:#0f766e;' : 'color:#94a3b8;'">
          {{ aiEnabled ? 'Live — Responding' : 'Off — Using Menus' }}
        </p>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-1 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] p-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150"
        :class="activeTab === tab.key
          ? 'bg-white text-[#102a43] shadow-sm font-semibold'
          : 'text-[#64748b] hover:text-[#102a43]'"
        @click="activeTab = tab.key"
      >
        <UIcon :name="tab.icon" style="width:15px;height:15px;" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ── KNOWLEDGE BASE TAB ── -->
    <div v-if="activeTab === 'knowledge'" class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden">

      <!-- Table Header -->
      <div class="px-6 pt-5 pb-4 border-b border-[#f1f5f9]">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <!-- Search -->
          <div class="flex h-10 max-w-sm flex-1 items-center gap-2 rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3">
            <UIcon name="i-heroicons-magnifying-glass-20-solid" style="width:15px;height:15px;color:#94a3b8;" />
            <input
              v-model="search"
              placeholder="Search knowledge entries..."
              class="w-full bg-transparent text-sm outline-none text-[#102a43]"
            />
          </div>

          <!-- Category filters + count -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              class="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
              :style="categoryFilter === 'All'
                ? 'background:#0f766e;color:#fff;border-color:#0f766e;'
                : 'background:#f8fbff;color:#64748b;border-color:#e7edf3;'"
              @click="categoryFilter = 'All'"
            >All</button>
            <button
              v-for="cat in categories"
              :key="cat"
              class="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
              :style="categoryFilter === cat
                ? `background:${categoryStyle[cat].bg};color:${categoryStyle[cat].color};border-color:${categoryStyle[cat].border};`
                : 'background:#f8fbff;color:#64748b;border-color:#e7edf3;'"
              @click="categoryFilter = cat"
            >{{ cat }}</button>
            <span class="rounded-full bg-[#0f766e] px-3 py-1 text-xs font-bold text-white">
              {{ filteredEntries.length }} Entries
            </span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px] text-sm">
          <thead>
            <tr class="bg-[#f8fbff]">
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Title</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Category</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Content Preview</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Status</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Updated</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingEntries">
              <td colspan="6" class="py-14 text-center text-sm text-[#94a3b8]">Loading knowledge entries...</td>
            </tr>
            <tr v-else-if="filteredEntries.length === 0">
              <td colspan="6" class="py-14 text-center text-sm text-[#94a3b8]">No entries found</td>
            </tr>
            <tr
              v-for="entry in filteredEntries"
              :key="entry.id"
              class="border-t border-[#f1f5f9] hover:bg-[#f8fbff] transition duration-150"
            >
              <td class="px-6 py-4 font-semibold text-[#102a43] max-w-[180px]">{{ entry.title }}</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                  :style="`background:${categoryStyle[entry.category].bg};color:${categoryStyle[entry.category].color};border-color:${categoryStyle[entry.category].border};`"
                >{{ entry.category }}</span>
              </td>
              <td class="px-6 py-4 text-[#64748b] max-w-[340px] truncate">{{ entry.content }}</td>
              <td class="px-6 py-4">
                <button
                  class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
                  :style="entry.active ? 'background:#0f766e;' : 'background:#cbd5e1;'"
                  @click="toggleActive(entry)"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200"
                    :style="entry.active ? 'transform:translateX(18px);' : 'transform:translateX(2px);'"
                  />
                </button>
              </td>
              <td class="px-6 py-4 text-xs text-[#94a3b8] whitespace-nowrap">{{ formatDate(entry.updatedAt) }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <UButton variant="ghost" color="neutral" icon="i-heroicons-pencil-square-20-solid" size="xs" @click="openEdit(entry)" />
                  <UButton variant="ghost" color="error" icon="i-heroicons-trash-20-solid" size="xs" @click="deleteEntry(entry.id)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── SYSTEM PROMPT TAB ── -->
    <div v-if="activeTab === 'prompt'" class="space-y-4">
      <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] p-7">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-[#102a43]">System Prompt</h2>
            <p class="mt-0.5 text-sm text-[#64748b]">This tells the AI its personality, rules, and how to behave. All caregiver conversations start with this context.</p>
          </div>
          <button
            class="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 flex-shrink-0"
            style="background:#0f766e;"
          >
            <UIcon name="i-heroicons-check-20-solid" style="width:15px;height:15px;" />
            Save Prompt
          </button>
        </div>

        <textarea
          v-model="systemPrompt"
          rows="8"
          class="w-full rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-5 py-4 text-sm text-[#102a43] outline-none transition focus:border-[#0f766e] resize-none leading-relaxed"
          placeholder="Describe how the AI should behave..."
        />

        <div class="mt-3 flex items-center gap-2 rounded-xl border border-[#fcd34d] bg-[#fffbeb] px-4 py-2.5">
          <UIcon name="i-heroicons-light-bulb-20-solid" style="width:15px;height:15px;color:#b45309;" />
          <p class="text-xs text-[#b45309]">Keep it clear and specific. Mention language (English/Spanish), tone (empathetic), length (short for SMS), and any hard rules (never shake, always 911 for emergencies).</p>
        </div>
      </div>

      <!-- Prompt Tips -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="tip in promptTips"
          :key="tip.title"
          class="rounded-2xl border border-[#e7edf3] bg-white p-5 shadow-sm"
        >
          <div class="flex items-center gap-3 mb-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl" :style="`background:${tip.bg};`">
              <UIcon :name="tip.icon" :style="`width:16px;height:16px;color:${tip.color};`" />
            </div>
            <p class="text-sm font-semibold text-[#102a43]">{{ tip.title }}</p>
          </div>
          <p class="text-xs text-[#64748b] leading-relaxed">{{ tip.body }}</p>
        </div>
      </div>
    </div>

    <!-- ── TEST PANEL TAB ── -->
    <div v-if="activeTab === 'test'" class="space-y-4">
      <div class="flex h-[calc(100vh-330px)] min-h-[460px] max-h-[700px] flex-col overflow-hidden rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div class="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[#f1f5f9] px-7 py-5">
          <div>
            <h2 class="text-lg font-bold text-[#102a43] mb-1">Test AI Chat</h2>
            <p class="text-sm text-[#64748b]">Chat with the AI tester and review every response plus the knowledge entries it used.</p>
          </div>
          <button
            class="flex flex-shrink-0 items-center gap-2 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#f1f5f9] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="testLoading || testChatMessages.length === 0"
            @click="clearTestChat"
          >
            <UIcon name="i-heroicons-trash-20-solid" style="width:15px;height:15px;" />
            Clear Chat
          </button>
        </div>

        <div ref="testChatScroll" class="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8fbff] px-5 py-6">
          <div v-if="testChatMessages.length" class="mx-auto flex max-w-4xl flex-col gap-5">
            <div
              v-for="message in testChatMessages"
              :key="message.id"
              class="flex"
              :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[82%] rounded-2xl px-5 py-4 shadow-sm"
                :class="message.role === 'user'
                  ? 'bg-[#0f766e] text-white'
                  : 'border border-[#e7edf3] bg-white text-[#102a43]'"
              >
                <div class="mb-2 flex items-center gap-2">
                  <div
                    class="flex h-6 w-6 items-center justify-center rounded-full"
                    :style="message.role === 'user' ? 'background:rgba(255,255,255,0.18);' : 'background:#eef2ff;'"
                  >
                    <UIcon
                      :name="message.role === 'user' ? 'i-heroicons-user-20-solid' : 'i-heroicons-sparkles-20-solid'"
                      :style="message.role === 'user' ? 'width:12px;height:12px;color:#fff;' : 'width:12px;height:12px;color:#4f46e5;'"
                    />
                  </div>
                  <p
                    class="text-xs font-semibold uppercase tracking-wide"
                    :class="message.role === 'user' ? 'text-white/80' : 'text-[#64748b]'"
                  >
                    {{ message.role === 'user' ? 'Caregiver Test Message' : 'AI Test Response' }}
                  </p>
                  <span
                    v-if="message.role === 'assistant'"
                    class="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    :style="message.isFallback
                      ? 'background:#fef3c7;color:#b45309;border:1px solid #fcd34d;'
                      : 'background:#ecfdf5;color:#065f46;border:1px solid #6ee7b7;'"
                  >
                    {{ message.isFallback ? 'Fallback' : `Gemini · ${message.model || 'AI'}` }}
                  </span>
                </div>

                <p class="whitespace-pre-line text-sm leading-relaxed">{{ message.text }}</p>

                <div v-if="message.role === 'assistant' && message.matched?.length" class="mt-4 rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-4 py-3">
                  <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#475569]">
                    Knowledge Used ({{ message.matched.length }})
                  </p>
                  <div class="space-y-1.5">
                    <div
                      v-for="match in message.matched"
                      :key="`${message.id}-${match}`"
                      class="flex items-center gap-2"
                    >
                      <div class="h-1.5 w-1.5 flex-shrink-0 rounded-full" style="background:#0f766e;" />
                      <p class="text-xs text-[#475569]">{{ match }}</p>
                    </div>
                  </div>
                </div>

                <p v-if="message.error" class="mt-3 rounded-xl bg-[#fff7ed] px-3 py-2 text-xs text-[#b45309]">
                  Gemini notice: {{ message.error }}
                </p>
              </div>
            </div>
          </div>

          <div v-else class="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl" style="background:rgba(99,102,241,0.10);">
              <UIcon name="i-heroicons-beaker-20-solid" style="width:22px;height:22px;color:#4f46e5;" />
            </div>
            <p class="text-sm font-medium text-[#102a43]">No test messages yet</p>
            <p class="text-xs text-[#94a3b8]">Send a message below to test RAG and Gemini response behavior</p>
          </div>
        </div>

        <div class="sticky bottom-0 z-10 flex-shrink-0 border-t border-[#e7edf3] bg-white px-5 py-4">
          <div class="mx-auto flex max-w-4xl gap-3">
            <div class="flex min-h-12 flex-1 items-center gap-2 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 py-3">
              <UIcon name="i-heroicons-chat-bubble-left-20-solid" style="width:16px;height:16px;color:#94a3b8;" />
              <input
                v-model="testMessage"
                placeholder="Type a caregiver message e.g. my baby wont stop crying..."
                class="w-full bg-transparent text-sm outline-none text-[#102a43]"
                @keydown.enter="runTest"
              />
            </div>
            <button
              class="flex flex-shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style="background:#0f766e;"
              :disabled="testLoading || !testMessage.trim()"
              @click="runTest"
            >
              <UIcon
                :name="testLoading ? 'i-heroicons-arrow-path-20-solid' : 'i-heroicons-paper-airplane-20-solid'"
                style="width:15px;height:15px;"
                :class="testLoading ? 'animate-spin' : ''"
              />
              {{ testLoading ? 'Testing...' : 'Send' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SETTINGS TAB ── -->
    <div v-if="activeTab === 'settings'" class="space-y-4">

      <!-- Response Style -->
      <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] p-7">
        <h2 class="text-base font-bold text-[#102a43] mb-1">Response Style</h2>
        <p class="text-sm text-[#64748b] mb-4">Controls how long and detailed AI replies will be over WhatsApp/SMS.</p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            v-for="opt in [
              { value: 'concise', label: 'Concise', desc: 'Under 160 characters. Best for SMS.' },
              { value: 'balanced', label: 'Balanced', desc: '2–3 sentences. Best for WhatsApp.' },
              { value: 'detailed', label: 'Detailed', desc: 'Full explanation with steps.' },
            ]"
            :key="opt.value"
            class="rounded-2xl border p-4 text-left transition-all duration-150"
            :style="responseStyle === opt.value
              ? 'border-color:#0f766e;background:#f0fdf8;'
              : 'border-color:#e7edf3;background:#f8fbff;'"
            @click="responseStyle = opt.value as any"
          >
            <div class="flex items-center justify-between mb-1">
              <p class="text-sm font-semibold text-[#102a43]">{{ opt.label }}</p>
              <div
                class="h-4 w-4 rounded-full border-2 flex items-center justify-center"
                :style="responseStyle === opt.value ? 'border-color:#0f766e;background:#0f766e;' : 'border-color:#cbd5e1;'"
              >
                <div v-if="responseStyle === opt.value" class="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
            </div>
            <p class="text-xs text-[#64748b]">{{ opt.desc }}</p>
          </button>
        </div>
      </div>

      <!-- Fallback + Emergency -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <!-- Fallback Behavior -->
        <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] p-7">
          <h2 class="text-base font-bold text-[#102a43] mb-1">Fallback Behavior</h2>
          <p class="text-sm text-[#64748b] mb-4">What happens when the AI is not confident enough to answer.</p>
          <div class="space-y-3">
            <button
              v-for="opt in fallbackOptions"
              :key="opt.value"
              class="flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150"
              :style="fallbackBehavior === opt.value
                ? 'border-color:#0f766e;background:#f0fdf8;'
                : 'border-color:#e7edf3;background:#f8fbff;'"
              @click="fallbackBehavior = opt.value as any"
            >
              <div
                class="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center"
                :style="fallbackBehavior === opt.value ? 'border-color:#0f766e;background:#0f766e;' : 'border-color:#cbd5e1;'"
              >
                <div v-if="fallbackBehavior === opt.value" class="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
              <div>
                <p class="text-sm font-semibold text-[#102a43]">{{ opt.label }}</p>
                <p class="text-xs text-[#64748b] mt-0.5">{{ opt.desc }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Emergency Override -->
        <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] p-7">
          <h2 class="text-base font-bold text-[#102a43] mb-1">Safety Settings</h2>
          <p class="text-sm text-[#64748b] mb-4">Critical safety rules that always apply, regardless of other settings.</p>

          <div
            class="flex items-start gap-4 rounded-2xl border p-4"
            :style="emergencyOverride ? 'border-color:#fca5a5;background:rgba(220,38,38,0.05);' : 'border-color:#e7edf3;background:#f8fbff;'"
          >
            <div class="flex-1">
              <p class="text-sm font-semibold text-[#102a43]">Emergency Override</p>
              <p class="text-xs text-[#64748b] mt-1">When danger keywords are detected (hurt, shake, angry), always send 911/988 regardless of confidence level.</p>
            </div>
            <button
              class="relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
              :style="emergencyOverride ? 'background:#dc2626;' : 'background:#cbd5e1;'"
              @click="emergencyOverride = !emergencyOverride"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                :style="emergencyOverride ? 'transform:translateX(22px);' : 'transform:translateX(2px);'"
              />
            </button>
          </div>

          <div class="mt-3 flex items-center gap-2 rounded-xl border border-[#fcd34d] bg-[#fffbeb] px-4 py-2.5">
            <UIcon name="i-heroicons-shield-check-20-solid" style="width:14px;height:14px;color:#b45309;" />
            <p class="text-xs text-[#b45309]">We strongly recommend keeping Emergency Override always on.</p>
          </div>
        </div>
      </div>

      <!-- Save Settings -->
      <div class="flex justify-end">
        <button
          class="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          style="background:#0f766e;"
        >
          <UIcon name="i-heroicons-check-20-solid" style="width:15px;height:15px;" />
          Save Settings
        </button>
      </div>
    </div>

  </div>

  <!-- ── ADD / EDIT SLIDE-OVER ── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showModal" class="fixed inset-0 z-50 flex">
        <!-- Backdrop -->
        <div class="flex-1 bg-black/30 backdrop-blur-sm" @click="showModal = false" />

        <!-- Panel -->
        <div class="w-full max-w-[480px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

          <!-- Panel Header -->
          <div class="flex items-center justify-between px-7 py-5 border-b border-[#f1f5f9]">
            <div>
              <h2 class="text-lg font-bold text-[#102a43]">{{ editingEntry ? 'Edit Entry' : 'Add Knowledge Entry' }}</h2>
              <p class="text-xs text-[#64748b] mt-0.5">This content will be used by the AI when answering caregivers</p>
            </div>
            <button
              class="flex h-8 w-8 items-center justify-center rounded-xl text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] transition"
              @click="showModal = false"
            >
              <UIcon name="i-heroicons-x-mark-20-solid" style="width:18px;height:18px;" />
            </button>
          </div>

          <!-- Form -->
          <div class="flex-1 px-7 py-6 space-y-5">

            <!-- Title -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#475569]">Title</label>
              <input
                v-model="formData.title"
                placeholder="e.g. Never shake a baby"
                class="w-full rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 py-3 text-sm text-[#102a43] outline-none transition focus:border-[#0f766e]"
              />
            </div>

            <!-- Category -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#475569]">Category</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="cat in categories"
                  :key="cat"
                  class="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
                  :style="formData.category === cat
                    ? `background:${categoryStyle[cat].bg};color:${categoryStyle[cat].color};border-color:${categoryStyle[cat].border};`
                    : 'background:#f8fbff;color:#64748b;border-color:#e7edf3;'"
                  @click="formData.category = cat"
                >{{ cat }}</button>
              </div>
            </div>

            <!-- Content -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#475569]">Content</label>
              <textarea
                v-model="formData.content"
                rows="6"
                placeholder="Write the knowledge content here. Be clear and specific — the AI will use this exact information when answering caregivers."
                class="w-full rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 py-3 text-sm text-[#102a43] outline-none transition focus:border-[#0f766e] resize-none leading-relaxed"
              />
              <p class="mt-1 text-xs text-[#94a3b8]">{{ formData.content.length }} characters</p>
            </div>

            <!-- Active Toggle -->
            <div class="flex items-center justify-between rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 py-3">
              <div>
                <p class="text-sm font-semibold text-[#102a43]">Active</p>
                <p class="text-xs text-[#64748b]">Inactive entries are not used by the AI</p>
              </div>
              <button
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
                :style="formData.active ? 'background:#0f766e;' : 'background:#cbd5e1;'"
                @click="formData.active = !formData.active"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                  :style="formData.active ? 'transform:translateX(22px);' : 'transform:translateX(2px);'"
                />
              </button>
            </div>
          </div>

          <!-- Panel Footer -->
          <div class="flex items-center justify-end gap-3 border-t border-[#f1f5f9] px-7 py-5">
            <button
              class="rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-5 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#f1f5f9] transition"
              @click="showModal = false"
            >Cancel</button>
            <button
              class="rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              :style="formData.title.trim() && formData.content.trim() && !savingEntries ? 'background:#0f766e;' : 'background:#cbd5e1;cursor:not-allowed;'"
              :disabled="!formData.title.trim() || !formData.content.trim() || savingEntries"
              @click="saveEntry"
            >{{ savingEntries ? 'Saving...' : editingEntry ? 'Save Changes' : 'Add Entry' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── FULL-SCREEN PREVIEW ── -->
  <Teleport to="body">
    <Transition name="preview">
      <div v-if="showPreview" class="fixed inset-0 z-[200] flex flex-col bg-white overflow-hidden">

        <!-- Preview Header -->
        <div class="flex flex-shrink-0 items-center justify-between gap-4 border-b border-[#e7edf3] bg-white px-8 py-4 shadow-sm">
          <div class="flex items-center gap-4">
            <button
              class="flex items-center gap-2 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-[#f1f5f9] transition"
              @click="showPreview = false"
            >
              <UIcon name="i-heroicons-arrow-left-20-solid" style="width:16px;height:16px;" />
              Back
            </button>
            <div>
              <h2 class="text-lg font-bold text-[#102a43]">Knowledge Base — Full Preview</h2>
              <p class="text-xs text-[#64748b]">{{ entries.length }} entries · click any row to expand and edit</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              class="rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9] transition"
              @click="expandAll"
            >Expand All</button>
            <button
              class="rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9] transition"
              @click="collapseAll"
            >Collapse All</button>
            <button
              class="flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style="background:#0f766e;"
              :disabled="savingEntries"
              @click="saveAllPreview"
            >
              <UIcon name="i-heroicons-check-20-solid" style="width:15px;height:15px;" />
              {{ savingEntries ? 'Saving...' : 'Save All' }}
            </button>
          </div>
        </div>

        <!-- Preview Table -->
        <div class="flex-1 overflow-y-auto px-8 py-6">
          <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-sm overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-[#f8fbff] border-b border-[#e7edf3]">
                  <th class="w-10 px-4 py-4" />
                  <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">#</th>
                  <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Title</th>
                  <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Category</th>
                  <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Status</th>
                  <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Updated</th>
                  <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Actions</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(entry, idx) in entries" :key="entry.id">
                  <!-- Main Row -->
                  <tr
                    class="border-t border-[#f1f5f9] transition duration-150 cursor-pointer"
                    :class="isExpanded(entry.id) ? 'bg-[#f0fdf8]' : 'hover:bg-[#f8fbff]'"
                    @click="toggleRow(entry.id)"
                  >
                    <!-- Expand chevron -->
                    <td class="px-4 py-4 text-center">
                      <UIcon
                        name="i-heroicons-chevron-right-20-solid"
                        style="width:16px;height:16px;transition:transform 0.2s;"
                        :style="isExpanded(entry.id) ? 'transform:rotate(90deg);color:#0f766e;' : 'color:#94a3b8;'"
                      />
                    </td>
                    <td class="px-5 py-4 text-xs text-[#94a3b8] font-mono">{{ String(idx + 1).padStart(2, '0') }}</td>
                    <td class="px-5 py-4 font-semibold text-[#102a43]" @click.stop>
                      <input
                        v-if="previewEdits[entry.id]"
                        v-model="previewEdits[entry.id].title"
                        class="w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-[#102a43] outline-none transition hover:border-[#e7edf3] focus:border-[#0f766e] focus:bg-white"
                        @click.stop
                      />
                    </td>
                    <td class="px-5 py-4">
                      <span
                        class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                        :style="`background:${categoryStyle[entry.category].bg};color:${categoryStyle[entry.category].color};border-color:${categoryStyle[entry.category].border};`"
                      >{{ entry.category }}</span>
                    </td>
                    <td class="px-5 py-4" @click.stop>
                      <button
                        class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
                        :style="entry.active ? 'background:#0f766e;' : 'background:#cbd5e1;'"
                        @click.stop="toggleActive(entry)"
                      >
                        <span
                          class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200"
                          :style="entry.active ? 'transform:translateX(18px);' : 'transform:translateX(2px);'"
                        />
                      </button>
                    </td>
                    <td class="px-5 py-4 text-xs text-[#94a3b8] whitespace-nowrap">{{ formatDate(entry.updatedAt) }}</td>
                    <td class="px-5 py-4" @click.stop>
                      <div class="flex items-center gap-2">
                        <UButton variant="ghost" color="neutral" icon="i-heroicons-pencil-square-20-solid" size="xs" @click.stop="openEdit(entry)" />
                        <UButton variant="ghost" color="error" icon="i-heroicons-trash-20-solid" size="xs" @click.stop="deleteEntry(entry.id)" />
                      </div>
                    </td>
                  </tr>

                  <!-- Expanded Content Row -->
                  <tr v-if="isExpanded(entry.id)" class="bg-[#f0fdf8]">
                    <td colspan="7" class="px-8 pb-5 pt-0">
                      <div class="flex flex-col gap-2">
                        <label class="text-[11px] font-semibold uppercase tracking-wide text-[#0f766e]">Full Content</label>
                        <textarea
                          v-if="previewEdits[entry.id]"
                          v-model="previewEdits[entry.id].content"
                          rows="4"
                          class="w-full rounded-2xl border border-[#bbf7e0] bg-white px-4 py-3 text-sm text-[#102a43] outline-none transition focus:border-[#0f766e] resize-y leading-relaxed"
                          placeholder="Write the full knowledge content here..."
                          @click.stop
                        />
                        <p class="text-xs text-[#94a3b8]">{{ (previewEdits[entry.id]?.content || '').length }} characters</p>
                      </div>
                    </td>
                  </tr>
                </template>

                <!-- Add New Entry Row -->
                <template v-if="previewNewMode">
                  <tr class="border-t border-[#f1f5f9] bg-[#fffbeb]">
                    <td class="px-4 py-4 text-center">
                      <UIcon name="i-heroicons-plus-20-solid" style="width:16px;height:16px;color:#b45309;" />
                    </td>
                    <td class="px-5 py-4 text-xs text-[#94a3b8] font-mono">{{ String(entries.length + 1).padStart(2, '0') }}</td>
                    <td class="px-5 py-4">
                      <input
                        v-model="previewNewForm.title"
                        placeholder="Entry title..."
                        class="w-full rounded-xl border border-[#e7edf3] bg-white px-3 py-1.5 text-sm font-semibold text-[#102a43] outline-none focus:border-[#0f766e]"
                      />
                    </td>
                    <td class="px-5 py-4">
                      <select
                        v-model="previewNewForm.category"
                        class="rounded-xl border border-[#e7edf3] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] outline-none cursor-pointer"
                      >
                        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                      </select>
                    </td>
                    <td class="px-5 py-4">
                      <span class="text-xs text-[#94a3b8]">Active</span>
                    </td>
                    <td class="px-5 py-4 text-xs text-[#94a3b8]">Today</td>
                    <td class="px-5 py-4">
                      <button
                        class="text-xs font-semibold text-[#dc2626] hover:underline"
                        @click="previewNewMode = false"
                      >Cancel</button>
                    </td>
                  </tr>
                  <tr class="bg-[#fffbeb]">
                    <td colspan="7" class="px-8 pb-5 pt-0">
                      <div class="flex flex-col gap-2">
                        <label class="text-[11px] font-semibold uppercase tracking-wide text-[#b45309]">Content</label>
                        <textarea
                          v-model="previewNewForm.content"
                          rows="4"
                          placeholder="Write the knowledge content here. The AI will use this when answering caregivers..."
                          class="w-full rounded-2xl border border-[#fcd34d] bg-white px-4 py-3 text-sm text-[#102a43] outline-none focus:border-[#b45309] resize-y leading-relaxed"
                        />
                      </div>
                    </td>
                  </tr>
                </template>

                <!-- Add New Row trigger -->
                <tr class="border-t border-[#f1f5f9]">
                  <td colspan="7" class="px-5 py-3">
                    <button
                      class="flex items-center gap-2 text-sm font-semibold text-[#0f766e] hover:underline transition"
                      @click="previewNewMode = true; expandedRows = []"
                    >
                      <UIcon name="i-heroicons-plus-circle-20-solid" style="width:18px;height:18px;" />
                      Add new knowledge entry
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Save Toast -->
        <Transition name="toast">
          <div
            v-if="saveToast"
            class="fixed bottom-6 right-6 z-[300] flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl"
            style="background:#0f766e;color:#fff;"
          >
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <UIcon name="i-heroicons-check-20-solid" style="width:16px;height:16px;" />
            </div>
            <div>
              <p class="text-sm font-bold">Saved successfully</p>
              <p class="text-xs text-white/80">All knowledge entries have been updated</p>
            </div>
          </div>
        </Transition>

      </div>
    </Transition>
  </Teleport>

</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .fixed > div:last-child,
.modal-leave-active .fixed > div:last-child {
  transition: transform 0.25s ease;
}
.modal-enter-from .fixed > div:last-child,
.modal-leave-to .fixed > div:last-child {
  transform: translateX(100%);
}

.preview-enter-active,
.preview-leave-active {
  transition: opacity 0.2s ease, transform 0.25s ease;
}
.preview-enter-from,
.preview-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
