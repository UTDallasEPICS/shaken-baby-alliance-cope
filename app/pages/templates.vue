<script setup lang="ts">
import { useAppSearch, rowMatchesAppSearch } from '~/composables/useAppSearch'

interface TemplateRow {
  id: number
  name: string
  category: string
  preview: string
  usage: string
  lastUpdated: string
}

const toast = useToast()

const { data: templatesData, refresh: refreshTemplates } = await useFetch<TemplateRow[]>('/api/templates', {
  default: () => [],
})

const templates = computed(() => templatesData.value ?? [])

const appSearch = useAppSearch()
const filteredTemplates = computed(() =>
  templates.value.filter((t) =>
    rowMatchesAppSearch(appSearch.value, t.name, t.category, t.preview, t.usage, t.lastUpdated),
  ),
)

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

const isTemplateModalOpen = ref(false)
const templateModalMode = ref<'create' | 'edit'>('create')

const templateForm = reactive<{
  id: number | null
  name: string
  category: string
  preview: string
  usage: string
  lastUpdated: string
}>({
  id: null,
  name: '',
  category: 'General',
  preview: '',
  usage: '0 flows',
  lastUpdated: todayISO(),
})

function openCreateTemplate() {
  templateModalMode.value = 'create'
  templateForm.id = null
  templateForm.name = ''
  templateForm.category = 'General'
  templateForm.preview = ''
  templateForm.usage = '0 flows'
  templateForm.lastUpdated = todayISO()
  isTemplateModalOpen.value = true
}

function openEditTemplate(t: TemplateRow) {
  templateModalMode.value = 'edit'
  templateForm.id = t.id
  templateForm.name = t.name
  templateForm.category = t.category
  templateForm.preview = t.preview
  templateForm.usage = t.usage
  templateForm.lastUpdated = t.lastUpdated
  isTemplateModalOpen.value = true
}

async function submitTemplate() {
  const name = templateForm.name.trim()
  const category = templateForm.category.trim()
  const preview = templateForm.preview.trim()
  const usage = templateForm.usage.trim()
  const lastUpdated = templateForm.lastUpdated.trim()

  if (!name || !category || !preview) {
    toast.add({ title: 'Name, category, and message are required', color: 'error' })
    return
  }

  if (templateModalMode.value === 'create') {
    await $fetch('/api/templates', {
      method: 'POST',
      body: { name, category, preview, usage, lastUpdated },
    })
    toast.add({ title: 'Template created', color: 'success' })
  } else {
    await $fetch(`/api/templates/${templateForm.id}`, {
      method: 'PUT',
      body: { name, category, preview, usage, lastUpdated },
    })
    toast.add({ title: 'Template updated', color: 'success' })
  }

  isTemplateModalOpen.value = false
  await refreshTemplates()
}

async function deleteTemplate(template: TemplateRow) {
  const ok = confirm(`Delete template "${template.name}"?`)
  if (!ok) return
  await $fetch(`/api/templates/${template.id}`, { method: 'DELETE' })
  await refreshTemplates()
  toast.add({ title: 'Template deleted', color: 'success' })
}

function viewTemplate(template: TemplateRow) {
  alert(template.preview)
}
</script>

<template>
  <UContainer class="py-6 space-y-4">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Templates</h1>
        <p class="text-sm text-gray-500 dark:text-gray-300">Manage reusable SMS message templates</p>
      </div>

      <UButton
        color="success"
        icon="i-heroicons-plus-20-solid"
        label="New Template"
        @click="openCreateTemplate"
      />
    </div>

    <UModal
      v-model:open="isTemplateModalOpen"
      :title="templateModalMode === 'create' ? 'New Template' : 'Edit Template'"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Name">
            <UInput v-model="templateForm.name" placeholder="Welcome Message" :ui="copeFieldUi" />
          </UFormField>

          <UFormField label="Category">
            <UInput v-model="templateForm.category" placeholder="Onboarding" :ui="copeFieldUi" />
          </UFormField>

          <UFormField label="Message">
            <UTextarea
              v-model="templateForm.preview"
              :rows="4"
              placeholder="Type the message..."
              :ui="copeFieldUi"
            />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Usage">
              <UInput v-model="templateForm.usage" placeholder="0 flows" :ui="copeFieldUi" />
            </UFormField>
            <UFormField label="Last Updated">
              <UInput v-model="templateForm.lastUpdated" placeholder="YYYY-MM-DD" :ui="copeFieldUi" />
            </UFormField>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" label="Cancel" @click="isTemplateModalOpen = false" />
          <UButton color="success" label="Save" @click="submitTemplate" />
        </div>
      </template>
    </UModal>

    <UCard class="bg-white! border-2 border-black rounded-xl p-3 dark:bg-[#134e4a]! dark:border-white" :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[980px] text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-white/20">
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Name</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Category</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Message Preview</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Usage</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Last Updated</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="template in filteredTemplates"
              :key="template.id"
              class="border-b border-gray-100 dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ template.name }}</td>
              <td class="px-4 py-3">
                <UBadge :label="template.category" color="primary" variant="solid" />
              </td>
              <td class="px-4 py-3 max-w-[360px] truncate text-gray-600 dark:text-gray-300">{{ template.preview }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ template.usage }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ template.lastUpdated }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <UButton
                    icon="i-heroicons-arrow-uturn-left-20-solid"
                    color="neutral"
                    variant="link"
                    @click="viewTemplate(template)"
                  />
                  <UButton
                    icon="i-heroicons-pencil-square-20-solid"
                    color="success"
                    variant="link"
                    @click="openEditTemplate(template)"
                  />
                  <UButton
                    icon="i-heroicons-trash-20-solid"
                    color="error"
                    variant="link"
                    @click="deleteTemplate(template)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </UContainer>
</template>

