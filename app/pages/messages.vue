<script setup lang="ts">
type ConversationSummary = {
  phone: string
  caregiverId: string | null
  contactName: string
  preferredLanguage: string | null
  caregiverStatus: string | null
  lastMessageAt: string
  lastMessageText: string
  lastDirection: string
  totalMessages: number
}

type ConversationMessage = {
  id: string
  caregiverId: string | null
  phone: string
  contactName: string
  messageText: string
  direction: string
  keywordDetected: string | null
  language: string | null
  workflowId: string | null
  workflowStepId: string | null
  providerName: string | null
  providerMessageId: string | null
  createdAt: string
  logStatus: string | null
  logEventType: string | null
  logErrorMessage: string | null
}

const selectedPhone = ref('')
const search = ref('')
const chatViewport = ref<HTMLElement | null>(null)
const conversationViewport = ref<HTMLElement | null>(null)
const preservedConversationScrollTop = ref(0)

const { data, pending } = await useFetch<{
  conversations: ConversationSummary[]
  activePhone: string
  messages: ConversationMessage[]
}>('/api/messages', {
  query: computed(() => ({
    phone: selectedPhone.value || undefined,
  })),
  watch: [selectedPhone],
})

const conversations = computed(() => data.value?.conversations ?? [])
const messages = computed(() => data.value?.messages ?? [])

const filteredConversations = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return conversations.value

  return conversations.value.filter((conversation) =>
    conversation.phone.toLowerCase().includes(term)
    || conversation.contactName.toLowerCase().includes(term)
    || conversation.lastMessageText.toLowerCase().includes(term)
  )
})

const activeConversation = computed(() =>
  conversations.value.find(conversation => conversation.phone === selectedPhone.value)
  || filteredConversations.value[0]
  || null
)

const currentWorkflowId = computed(() => {
  for (const message of [...messages.value].reverse()) {
    if (message.workflowId) return message.workflowId
  }
  return null
})

const currentStepId = computed(() => {
  for (const message of [...messages.value].reverse()) {
    if (message.workflowStepId) return message.workflowStepId
  }
  return null
})

const currentKeyword = computed(() => {
  for (const message of [...messages.value].reverse()) {
    if (message.keywordDetected) return message.keywordDetected
  }
  return null
})

function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function formatWorkflowLabel(workflowId: string | null) {
  if (!workflowId) return 'No Workflow'
  if (workflowId === 'flow-help') return 'Crisis Support'
  if (workflowId === 'flow-welcome') return 'Welcome Flow'
  return titleCase(workflowId)
}

function formatStepLabel(stepId: string | null) {
  if (!stepId) return 'No Step'

  const cleaned = stepId.replace(/^step-/, '').replace(/^trigger-/, '')
  if (/^\d+$/.test(cleaned)) return `Step ${cleaned}`

  return titleCase(cleaned)
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function previewText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function unreadBadge(conversation: ConversationSummary) {
  return conversation.lastDirection === 'INBOUND' ? '1 new' : ''
}

function selectConversation(phone: string) {
  if (conversationViewport.value) {
    preservedConversationScrollTop.value = conversationViewport.value.scrollTop
  }
  selectedPhone.value = phone
}

watch(
  () => data.value?.activePhone,
  (activePhone) => {
    if (!selectedPhone.value && activePhone) {
      selectedPhone.value = activePhone
    }
  },
  { immediate: true }
)

watch(activeConversation, (conversation) => {
  if (!conversation) return
  if (!selectedPhone.value) selectedPhone.value = conversation.phone
}, { immediate: true })

watch(messages, async () => {
  await nextTick()
  if (chatViewport.value) {
    chatViewport.value.scrollTop = chatViewport.value.scrollHeight
  }
}, { immediate: true })

watch(
  () => data.value?.messages,
  async () => {
    await nextTick()
    if (conversationViewport.value) {
      conversationViewport.value.scrollTop = preservedConversationScrollTop.value
    }
  }
)
</script>

<template>
  <div class="messages-page">
    <div class="messages-shell">
      <section class="conversation-panel card-panel">
        <div class="panel-header">
          <h2>Conversations</h2>

          <div class="search-box">
            <UIcon name="i-heroicons-magnifying-glass-20-solid" class="search-icon" />
            <input
              v-model="search"
              placeholder="Search conversations..."
              class="search-input"
            >
          </div>
        </div>

        <div v-if="pending" class="panel-empty">
          Loading conversations...
        </div>

        <div
          v-else
          ref="conversationViewport"
          class="conversation-list"
        >
          <button
            v-for="conversation in filteredConversations"
            :key="conversation.phone"
            class="conversation-item"
            :class="{ active: conversation.phone === activeConversation?.phone }"
            @click="selectConversation(conversation.phone)"
          >
            <div class="conversation-row">
              <div class="conversation-meta">
                <p class="conversation-name">{{ conversation.contactName || 'Unknown Sender' }}</p>
                <p class="conversation-phone">{{ conversation.phone }}</p>
              </div>
              <p class="conversation-time">{{ formatTime(conversation.lastMessageAt) }}</p>
            </div>

            <p class="conversation-preview">{{ previewText(conversation.lastMessageText) }}</p>

            <div v-if="unreadBadge(conversation)" class="conversation-badges">
              <span class="new-badge">{{ unreadBadge(conversation) }}</span>
            </div>
          </button>

          <div v-if="filteredConversations.length === 0" class="panel-empty">
            No conversations found.
          </div>
        </div>
      </section>

      <section class="thread-panel card-panel">
        <div class="thread-header">
          <template v-if="activeConversation">
            <h2>{{ activeConversation.contactName || 'Unknown Sender' }}</h2>
            <p class="thread-phone">{{ activeConversation.phone }}</p>

            <div class="thread-tags">
              <span v-if="currentKeyword" class="thread-tag tag-keyword">
                Keyword: {{ currentKeyword }}
              </span>
              <span v-if="currentWorkflowId" class="thread-tag tag-workflow">
                Workflow: {{ formatWorkflowLabel(currentWorkflowId) }}
              </span>
              <span v-if="currentStepId" class="thread-tag tag-step">
                {{ formatStepLabel(currentStepId) }}
              </span>
            </div>
          </template>

          <p v-else class="thread-empty-copy">Select a conversation to view the SMS thread.</p>
        </div>

        <div ref="chatViewport" class="thread-body">
          <div v-if="!messages.length" class="panel-empty thread-empty">
            No messages stored for this conversation yet.
          </div>

          <div v-else class="message-stack">
            <div
              v-for="message in messages"
              :key="message.id"
              class="message-row"
              :class="message.direction === 'INBOUND' ? 'is-inbound' : 'is-outbound'"
            >
              <div class="message-bubble" :class="message.direction === 'INBOUND' ? 'bubble-inbound' : 'bubble-system'">
                <div class="message-meta">
                  <span>{{ message.direction === 'INBOUND' ? 'Caregiver' : 'System' }}</span>
                  <span>{{ formatTime(message.createdAt) }}</span>
                </div>
                <p>{{ message.messageText }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.messages-page {
  max-width: 1440px;
  margin: 0 auto;
  height: calc(100vh - 220px);
  min-height: 520px;
  overflow: hidden;
}

.messages-shell {
  display: grid;
  grid-template-columns: 440px minmax(0, 1fr);
  gap: 28px;
  height: 100%;
}

.card-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #d9e4ef;
  border-radius: 26px;
  box-shadow: 0 6px 22px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.panel-header {
  padding: 22px 24px 16px;
}

.panel-header h2,
.thread-header h2 {
  margin: 0;
  color: #102a43;
  font-size: 18px;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 44px;
  margin-top: 16px;
  padding: 0 14px;
  border-radius: 16px;
  background: #f4f7fb;
}

.search-icon {
  width: 20px;
  height: 20px;
  color: #8193a8;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  border: 0;
  background: transparent;
  outline: 0;
  font-size: 15px;
  color: #102a43;
}

.search-input::placeholder {
  color: #8ba0b7;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px 14px;
}

.conversation-item {
  width: 100%;
  margin-bottom: 10px;
  padding: 14px 14px;
  border: 0;
  border-radius: 18px;
  background: #fff;
  text-align: left;
  transition: background-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
}

.conversation-item:hover {
  background: #f8fbff;
}

.conversation-item.active {
  background: #25a39a;
  color: #fff;
  box-shadow: 0 14px 30px rgba(37, 163, 154, 0.22);
}

.conversation-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.conversation-meta {
  min-width: 0;
}

.conversation-name {
  margin: 0;
  font-size: 14px;
  line-height: 1.25;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-phone,
.conversation-time {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.2;
  color: #6b7c93;
}

.conversation-item.active .conversation-phone,
.conversation-item.active .conversation-time {
  color: rgba(255, 255, 255, 0.82);
}

.conversation-preview {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: #44576b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.conversation-item.active .conversation-preview {
  color: rgba(255, 255, 255, 0.92);
}

.conversation-badges {
  margin-top: 10px;
}

.new-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 66px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #1f9d94;
  color: #fff;
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
}

.conversation-item.active .new-badge {
  background: #fff;
  color: #1a8e85;
}

.thread-header {
  flex-shrink: 0;
  min-height: 126px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid #e8eef5;
}

.thread-phone {
  margin: 8px 0 0;
  color: #6b7c93;
  font-size: 12px;
  line-height: 1.3;
}

.thread-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.thread-tag {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 600;
}

.tag-keyword {
  color: #16938a;
  background: #effcf9;
  border-color: #b5ebe4;
}

.tag-workflow {
  color: #2459ff;
  background: #f2f7ff;
  border-color: #bfd7ff;
}

.tag-step {
  color: #8b2cf5;
  background: #fcf6ff;
  border-color: #ebd5ff;
}

.thread-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px 20px;
  background: #fff;
}

.message-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.message-row {
  display: flex;
}

.is-inbound {
  justify-content: flex-end;
}

.is-outbound {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 76%;
  padding: 12px 14px;
  border-radius: 18px;
}

.bubble-inbound {
  background: #25a39a;
  color: #fff;
  box-shadow: 0 14px 30px rgba(37, 163, 154, 0.16);
}

.bubble-system {
  background: #f1f5fa;
  border: 1px solid #e6ecf3;
  color: #102a43;
}

.message-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 11px;
  line-height: 1.2;
}

.bubble-inbound .message-meta {
  color: rgba(255, 255, 255, 0.82);
}

.bubble-system .message-meta {
  color: #6b7c93;
}

.message-bubble p {
  margin: 0;
  white-space: pre-line;
  font-size: 12px;
  line-height: 1.5;
}

.panel-empty,
.thread-empty-copy {
  color: #6b7c93;
  font-size: 14px;
  line-height: 1.4;
}

.panel-empty {
  padding: 24px 30px 28px;
}

.thread-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

@media (max-width: 1280px) {
  .messages-page {
    height: calc(100vh - 210px);
  }

  .messages-shell {
    grid-template-columns: 380px minmax(0, 1fr);
  }
}

@media (max-width: 1024px) {
  .messages-page {
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .messages-shell {
    grid-template-columns: 1fr;
    height: auto;
  }

  .thread-body {
    min-height: 420px;
  }
}

@media (max-width: 640px) {
  .panel-header,
  .thread-header {
    padding-left: 18px;
    padding-right: 18px;
  }

  .conversation-list,
  .thread-body {
    padding-left: 12px;
    padding-right: 12px;
  }

  .message-bubble {
    max-width: 92%;
  }
}
</style>