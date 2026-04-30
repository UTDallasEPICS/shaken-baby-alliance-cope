<script setup lang="ts">
const route = useRoute()
const caregiverId = computed(() => String(route.params.id || ''))
const availableKeywords = ['HELP', 'COPE', 'CALM', 'EMERGENCY']

type CaregiverDetail = {
  id: string
  name: string | null
  phone: string
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  status: string
  firstContactDate: string
  lastInteraction: string | null
}

type DetailResponse = {
  caregiver: CaregiverDetail
  summary: {
    totalMessages: number
    keywordCount: number
    keywordsUsed: string[]
    assignedKeywords: string[]
    workflowsTriggered: number
    firstContactDate: string
    lastInteraction: string | null
  }
  messages: Array<{
    id: string
    messageText: string
    direction: string
    keywordDetected: string | null
    createdAt: string
  }>
  notes: Array<{
    id: string
    body: string
    authorName: string
    createdAt: string
  }>
}

const { show: showToast } = useAppToast()
const noteBody = ref('')
const savingNote = ref(false)
const showEditModal = ref(false)
const savingEdit = ref(false)

const { data, error, refresh, pending } = await useFetch<DetailResponse>(
  () => `/api/caregivers/${caregiverId.value}`,
  { key: () => `caregiver-${caregiverId.value}` }
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Caregiver not found',
  })
}

const caregiver = computed(() => data.value?.caregiver ?? null)
const summary = computed(() => data.value?.summary ?? null)
const conversation = computed(() => data.value?.messages ?? [])
const notes = computed(() => data.value?.notes ?? [])

const editForm = ref({
  name: '',
  phone: '',
  email: '',
  address: '',
  cityState: '',
  firstContactDate: '',
  lastInteraction: '',
  status: 'active' as 'active' | 'inactive',
  keywords: [] as string[],
})

watch(
  data,
  (value) => {
    if (!value?.caregiver) return
    editForm.value = {
      name: value.caregiver.name || '',
      phone: value.caregiver.phone || '',
      email: value.caregiver.email || '',
      address: value.caregiver.address || '',
      cityState: [value.caregiver.city, value.caregiver.state].filter(Boolean).join(', '),
      firstContactDate: toInputDate(value.caregiver.firstContactDate),
      lastInteraction: toInputDate(value.caregiver.lastInteraction),
      status: value.caregiver.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active',
      keywords: [...(value.summary?.assignedKeywords ?? [])],
    }
  },
  { immediate: true }
)

function toInputDate(value?: string | null) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString([], {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusLabel(status?: string | null) {
  const normalized = String(status || 'ACTIVE').toLowerCase()
  if (normalized === 'inactive') return 'Inactive'
  if (normalized === 'deleted') return 'Deleted'
  return 'Active'
}

function statusClasses(status?: string | null) {
  const normalized = String(status || 'ACTIVE').toLowerCase()
  if (normalized === 'inactive') return 'bg-slate-100 text-slate-600 border-slate-200'
  if (normalized === 'deleted') return 'bg-red-50 text-red-600 border-red-200'
  return 'bg-green-50 text-green-600 border-green-200'
}

function directionClasses(direction: string) {
  return direction?.toUpperCase() === 'INBOUND'
    ? 'ml-auto bg-[#1f9d94] text-white'
    : 'mr-auto bg-[#f1f5f9] text-[#102a43]'
}

function directionLabel(direction: string) {
  return direction?.toUpperCase() === 'INBOUND' ? 'Caregiver' : 'System'
}

function toggleEditKeyword(keyword: string) {
  const idx = editForm.value.keywords.indexOf(keyword)
  if (idx === -1) editForm.value.keywords.push(keyword)
  else editForm.value.keywords.splice(idx, 1)
}

function parseCityState(cityState: string) {
  const [city, state] = cityState.split(',').map(part => part.trim())
  return { city: city || '', state: state || '' }
}

async function saveNote() {
  if (!noteBody.value.trim()) return
  savingNote.value = true
  try {
    await $fetch(`/api/caregivers/${caregiverId.value}/notes`, {
      method: 'POST',
      body: { body: noteBody.value },
    })
    noteBody.value = ''
    await refresh()
    showToast('Note added successfully', 'success')
  } finally {
    savingNote.value = false
  }
}

async function saveEdit() {
  if (!caregiver.value) return
  savingEdit.value = true
  try {
    const { city, state } = parseCityState(editForm.value.cityState)
    await $fetch('/api/caregivers', {
      method: 'PUT',
      body: {
        id: caregiver.value.id,
        name: editForm.value.name,
        phone: editForm.value.phone,
        email: editForm.value.email,
        address: editForm.value.address,
        city,
        state,
        status: editForm.value.status.toUpperCase(),
        firstContactDate: editForm.value.firstContactDate || undefined,
        lastInteraction: editForm.value.lastInteraction || undefined,
        keywords: editForm.value.keywords,
      },
    })
    showEditModal.value = false
    await refresh()
    showToast('Caregiver profile updated', 'success')
  } finally {
    savingEdit.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1320px] space-y-5 sm:space-y-8">
    <div v-if="pending" class="rounded-[30px] border border-[#e7edf3] bg-white p-8 text-sm text-[#64748b] shadow-sm">
      Loading caregiver profile...
    </div>

    <template v-else-if="caregiver && summary">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex items-start gap-4">
          <button
            class="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e7edf3] bg-white text-[#102a43] shadow-sm transition hover:bg-[#f8fbff]"
            @click="navigateTo('/caregivers')"
          >
            <UIcon name="i-heroicons-arrow-left-20-solid" style="width:18px;height:18px;" />
          </button>

          <div>
            <h1 class="text-[22px] font-bold text-[#102a43] sm:text-[26px]">Caregiver Profile</h1>
            <p class="mt-1 text-base text-[#64748b]">Detailed information and interaction history</p>
          </div>
        </div>

        <button
          class="inline-flex items-center justify-center rounded-2xl border border-[#e7edf3] bg-white px-5 py-3 text-sm font-semibold text-[#102a43] shadow-sm transition hover:bg-[#f8fbff]"
          @click="showEditModal = true"
        >
          Edit Profile
        </button>
      </div>

      <div class="grid gap-4 sm:gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section class="rounded-[28px] border border-[#e7edf3] bg-white p-4 sm:p-7 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
          <p class="text-[18px] font-semibold text-[#102a43]">Basic Information</p>

          <div class="mt-8">
            <h2 class="text-[24px] font-medium text-[#102a43]">{{ caregiver.name || 'Unnamed caregiver' }}</h2>
            <span
              class="mt-4 inline-flex rounded-full border px-3 py-1 text-sm font-semibold"
              :class="statusClasses(caregiver.status)"
            >
              {{ statusLabel(caregiver.status) }}
            </span>
          </div>

          <div class="mt-8 space-y-5 border-t border-[#e7edf3] pt-7 text-[#475569]">
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-phone-20-solid" class="mt-0.5 text-[#64748b]" style="width:18px;height:18px;" />
              <span class="text-[17px]">{{ caregiver.phone || '-' }}</span>
            </div>
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-envelope-20-solid" class="mt-0.5 text-[#64748b]" style="width:18px;height:18px;" />
              <span class="text-[17px] break-all">{{ caregiver.email || '-' }}</span>
            </div>
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-map-pin-20-solid" class="mt-0.5 text-[#64748b]" style="width:18px;height:18px;" />
              <span class="text-[17px]">
                {{ caregiver.address || '-' }}
                <template v-if="caregiver.city || caregiver.state || caregiver.zip">
                  <br>
                  {{ [caregiver.city, caregiver.state].filter(Boolean).join(', ') || caregiver.zip }}
                  <template v-if="(caregiver.city || caregiver.state) && caregiver.zip"> {{ caregiver.zip }}</template>
                </template>
              </span>
            </div>
          </div>
        </section>

        <section class="rounded-[28px] border border-[#e7edf3] bg-white p-4 sm:p-7 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
          <p class="text-[18px] font-semibold text-[#102a43]">Interaction Summary</p>

          <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-[22px] border border-[#d7efed] bg-[#f4fbfb] p-5">
              <p class="text-[17px] text-[#64748b]">Total Messages</p>
              <p class="mt-3 text-[28px] font-semibold text-[#0f766e]">{{ summary.totalMessages }}</p>
            </div>
            <div class="rounded-[22px] border border-[#dbe7fb] bg-[#f4f8ff] p-5">
              <p class="text-[17px] text-[#64748b]">Keywords Used</p>
              <p class="mt-3 text-[28px] font-semibold text-[#2563eb]">{{ summary.keywordCount }}</p>
            </div>
            <div class="rounded-[22px] border border-[#f2dffc] bg-[#fcf7ff] p-5">
              <p class="text-[17px] text-[#64748b]">Workflows Triggered</p>
              <p class="mt-3 text-[28px] font-semibold text-[#9333ea]">{{ summary.workflowsTriggered }}</p>
            </div>
            <div class="rounded-[22px] border border-[#d7efdf] bg-[#f5fcf7] p-5">
              <p class="text-[17px] text-[#64748b]">Last Interaction</p>
              <p class="mt-3 text-[22px] font-semibold text-[#15803d]">{{ formatDate(summary.lastInteraction) }}</p>
            </div>
          </div>

          <div class="mt-8">
            <p class="text-[17px] text-[#475569]">Keywords Used:</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="keyword in summary.keywordsUsed"
                :key="keyword"
                class="rounded-full border border-[#99f6e4] bg-[#ecfdf5] px-3 py-1 text-sm font-medium text-[#0f766e]"
              >
                {{ keyword }}
              </span>
              <span
                v-if="summary.keywordsUsed.length === 0"
                class="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-sm font-medium text-[#64748b]"
              >
                No keywords yet
              </span>
            </div>
          </div>

          <div class="mt-8 border-t border-[#e7edf3] pt-6">
            <div class="flex items-center gap-3 text-[17px] text-[#64748b]">
              <UIcon name="i-heroicons-calendar-days-20-solid" style="width:18px;height:18px;" />
              <span>First Contact: {{ formatDate(summary.firstContactDate) }}</span>
            </div>
          </div>
        </section>
      </div>

      <section class="rounded-[28px] border border-[#e7edf3] bg-white p-4 sm:p-7 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
        <h2 class="text-[18px] font-semibold text-[#102a43]">SMS Conversation History</h2>
        <p class="mt-1 text-base text-[#64748b]">Recent message exchanges with the system</p>

        <div
          v-if="conversation.length === 0"
          class="mt-8 rounded-[22px] border border-dashed border-[#dbe3ec] bg-[#f8fbff] px-6 py-10 text-center text-sm text-[#64748b]"
        >
          No conversation history is available for this caregiver yet.
        </div>

        <div v-else class="mt-8 space-y-5">
          <div
            v-for="message in conversation"
            :key="message.id"
            class="max-w-[760px] rounded-[22px] px-5 py-4 shadow-sm"
            :class="directionClasses(message.direction)"
          >
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-80">
              <span>{{ directionLabel(message.direction) }}</span>
              <span>{{ formatDateTime(message.createdAt) }}</span>
            </div>
            <p class="mt-3 whitespace-pre-line text-[17px] leading-7">{{ message.messageText }}</p>
          </div>
        </div>
      </section>

      <section class="rounded-[28px] border border-[#e7edf3] bg-white p-4 sm:p-7 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
        <h2 class="text-[18px] font-semibold text-[#102a43]">Admin Notes</h2>
        <p class="mt-1 text-base text-[#64748b]">Internal notes and observations</p>

        <div class="mt-8 space-y-4">
          <div
            v-for="note in notes"
            :key="note.id"
            class="rounded-[20px] bg-[#f8fbff] px-5 py-5 text-[#102a43]"
          >
            <p class="text-[17px] leading-7">{{ note.body }}</p>
            <div class="mt-4 text-sm text-[#64748b]">
              By: {{ note.authorName }}
              <span class="mx-2">|</span>
              {{ formatDateTime(note.createdAt) }}
            </div>
          </div>

          <div
            v-if="notes.length === 0"
            class="rounded-[20px] border border-dashed border-[#dbe3ec] bg-[#f8fbff] px-5 py-8 text-sm text-[#64748b]"
          >
            No admin notes yet.
          </div>
        </div>

        <div class="mt-8 border-t border-[#e7edf3] pt-6">
          <p class="text-[18px] font-semibold text-[#102a43]">Add New Note</p>
          <textarea
            v-model="noteBody"
            rows="4"
            placeholder="Enter note..."
            class="mt-4 w-full rounded-[18px] border border-[#e7edf3] bg-[#f8fbff] px-4 py-3 text-sm text-[#102a43] outline-none transition focus:border-[#c9a227] focus:ring-2 focus:ring-[#fef3c7]"
          />

          <button
            class="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#fbbf24] px-5 py-3 text-sm font-semibold text-[#102a43] shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="savingNote || !noteBody.trim()"
            @click="saveNote"
          >
            <UIcon name="i-heroicons-plus-20-solid" style="width:16px;height:16px;" />
            {{ savingNote ? 'Saving...' : 'Add Note' }}
          </button>
        </div>
      </section>

      <UModal v-model:open="showEditModal" title="Edit Caregiver Profile" :ui="{ content: 'sm:max-w-2xl' }">
        <template #body>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-[#475569]">Full Name</label>
              <UInput v-model="editForm.name" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-[#475569]">Phone Number</label>
              <UInput v-model="editForm.phone" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-[#475569]">Email</label>
              <UInput v-model="editForm.email" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-[#475569]">Address</label>
              <UInput v-model="editForm.address" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-[#475569]">City / State</label>
              <UInput v-model="editForm.cityState" class="w-full" placeholder="Dallas, TX" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-[#475569]">First Contact</label>
              <UInput v-model="editForm.firstContactDate" type="date" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-[#475569]">Last Interaction</label>
              <UInput v-model="editForm.lastInteraction" type="date" class="w-full" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-2 block text-sm font-medium text-[#475569]">Status</label>
              <div class="flex gap-3">
                <button
                  v-for="status in ['active', 'inactive']"
                  :key="status"
                  type="button"
                  class="rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition"
                  :class="editForm.status === status
                    ? status === 'active'
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-slate-400 bg-slate-400 text-white'
                    : 'border-[#e7edf3] bg-white text-[#64748b] hover:border-[#94a3b8]'"
                  @click="editForm.status = status as 'active' | 'inactive'"
                >
                  {{ status }}
                </button>
              </div>
            </div>
            <div class="sm:col-span-2">
              <label class="mb-2 block text-sm font-medium text-[#475569]">Keywords Used</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="keyword in availableKeywords"
                  :key="keyword"
                  type="button"
                  class="rounded-full border px-3 py-1 text-xs font-semibold transition"
                  :class="editForm.keywords.includes(keyword)
                    ? 'border-[#0f766e] bg-[#0f766e] text-white'
                    : 'border-[#e7edf3] bg-white text-[#64748b] hover:border-[#0f766e] hover:text-[#0f766e]'"
                  @click="toggleEditKeyword(keyword)"
                >
                  {{ keyword }}
                </button>
              </div>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="outline" label="Cancel" @click="showEditModal = false" />
            <UButton
              color="primary"
              :label="savingEdit ? 'Saving...' : 'Save Changes'"
              :disabled="savingEdit || !editForm.name.trim() || !editForm.phone.trim() || !editForm.email.trim()"
              @click="saveEdit"
            />
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
