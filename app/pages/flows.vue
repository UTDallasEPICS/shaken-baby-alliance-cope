<script setup lang="ts">
import { useAppSearch, rowMatchesAppSearch } from '~/composables/useAppSearch'

type FlowStatus = 'Active' | 'Draft'

interface FlowRow {
  id: number
  name: string
  keyword: string
  status: FlowStatus
}

const toast = useToast()

const { data: flowsData, refresh: refreshFlows } = await useFetch<FlowRow[]>('/api/flows', {
  default: () => [],
})

const flows = computed(() => flowsData.value ?? [])

const appSearch = useAppSearch()
const filteredFlows = computed(() =>
  flows.value.filter((f) => rowMatchesAppSearch(appSearch.value, f.name, f.keyword, f.status)),
)

const isFlowModalOpen = ref(false)
const flowModalMode = ref<'create' | 'edit'>('create')

const flowForm = reactive<{
  id: number | null
  name: string
  keyword: string
  status: FlowStatus
}>({
  id: null,
  name: '',
  keyword: '',
  status: 'Active',
})

function openCreateFlow() {
  flowModalMode.value = 'create'
  flowForm.id = null
  flowForm.name = ''
  flowForm.keyword = ''
  flowForm.status = 'Active'
  isFlowModalOpen.value = true
}

function openEditFlow(flow: FlowRow) {
  flowModalMode.value = 'edit'
  flowForm.id = flow.id
  flowForm.name = flow.name
  flowForm.keyword = flow.keyword
  flowForm.status = flow.status
  isFlowModalOpen.value = true
}

async function submitFlow() {
  const name = flowForm.name.trim()
  const keyword = flowForm.keyword.trim()
  if (!name || !keyword) {
    toast.add({ title: 'Name and keyword are required', color: 'error' })
    return
  }

  if (flowModalMode.value === 'create') {
    await $fetch('/api/flows', { method: 'POST', body: { name, keyword, status: flowForm.status } })
    toast.add({ title: 'Flow created', color: 'success' })
  } else {
    await $fetch(`/api/flows/${flowForm.id}`, {
      method: 'PUT',
      body: { name, keyword, status: flowForm.status },
    })
    toast.add({ title: 'Flow updated', color: 'success' })
  }

  isFlowModalOpen.value = false
  await refreshFlows()
}

async function deleteFlow(flow: FlowRow) {
  const ok = confirm(`Delete flow "${flow.name}"?`)
  if (!ok) return

  await $fetch(`/api/flows/${flow.id}`, { method: 'DELETE' })
  await refreshFlows()
  toast.add({ title: 'Flow deleted', color: 'success' })
}
</script>

<template>
  <UContainer class="py-6 space-y-4">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Flows</h1>
        <p class="text-sm text-gray-500 dark:text-gray-300">Manage your SMS interaction flows</p>
      </div>

      <UButton
        color="success"
        icon="i-heroicons-plus-20-solid"
        label="New Flow"
        @click="openCreateFlow"
      />
    </div>

    <UModal
      v-model:open="isFlowModalOpen"
      :title="flowModalMode === 'create' ? 'New Flow' : 'Edit Flow'"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Name">
            <UInput v-model="flowForm.name" placeholder="Daily Check-in" :ui="copeFieldUi" />
          </UFormField>

          <UFormField label="Trigger Keyword">
            <UInput v-model="flowForm.keyword" placeholder="CHECKIN" :ui="copeFieldUi" />
          </UFormField>

          <UFormField label="Status">
            <USelect v-model="flowForm.status" :items="['Active', 'Draft']" :ui="copeFieldUi" />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" label="Cancel" @click="isFlowModalOpen = false" />
          <UButton color="success" label="Save" @click="submitFlow" />
        </div>
      </template>
    </UModal>

    <UCard class="bg-white! border-2 border-black rounded-xl p-3 dark:bg-[#134e4a]! dark:border-white" :ui="{ body: 'p-0 sm:p-0' }">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-white/20">
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Name</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Trigger Keyword</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Status</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="flow in filteredFlows"
            :key="flow.id"
            class="border-b border-gray-100 dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ flow.name }}</td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ flow.keyword }}</td>
            <td class="px-4 py-3">
              <UBadge
                :color="flow.status === 'Active' ? 'success' : 'neutral'"
                variant="solid"
                :label="flow.status"
              />
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <UButton
                  variant="link"
                  color="success"
                  icon="i-heroicons-pencil-square-20-solid"
                  label="Edit"
                  @click="openEditFlow(flow)"
                />
                <UButton
                  variant="link"
                  color="error"
                  icon="i-heroicons-trash-20-solid"
                  label="Delete"
                  @click="deleteFlow(flow)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>
  </UContainer>
</template>

