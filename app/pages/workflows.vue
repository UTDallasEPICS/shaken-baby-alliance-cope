<script setup lang="ts">
type StepType = 'trigger' | 'message' | 'menu' | 'end'
type LocaleKey = 'en' | 'es'
type InspectorTab = 'content' | 'options' | 'routing'

type LocalizedText = Record<LocaleKey, string>

type StepOption = {
  id: string
  label: LocalizedText
  replyValue: string
  targetStepId: string | null
}

type WorkflowStep = {
  id: string
  type: StepType
  title: string
  keyword: string
  content: LocalizedText
  nextStepId: string | null
  options: StepOption[]
  x: number
  y: number
}

type WorkflowFlow = {
  id: string
  name: string
  description: string
  status: 'draft' | 'published'
  publishedAt: string | null
  steps: WorkflowStep[]
  selectedStepId: string
}

type HistorySnapshot = {
  flows: WorkflowFlow[]
  activeFlowId: string
  locale: LocaleKey
  zoom: number
  panX: number
  panY: number
}

type PreviewMode = 'overview' | 'messages'

type PreviewChatMessage = {
  id: string
  role: 'bot' | 'user' | 'system'
  text: string
  stepId?: string | null
}

const { show: showToast } = useAppToast()
const workflowMaximized = useState('workflow-builder-maximized', () => false)
const workflowCanvasMaximized = useState('workflow-canvas-maximized', () => false)

const locale = ref<LocaleKey>('en')
const inspectorTab = ref<InspectorTab>('content')
const previewOpen = ref(false)
const previewMode = ref<PreviewMode>('messages')
const previewLocale = ref<LocaleKey>('en')
const createFlowOpen = ref(false)
const libraryPanelOpen = ref(false)
const flowMenuOpenId = ref<string | null>(null)
const exportMenuOpen = ref(false)
const zoom = ref(1)
const panX = ref(120)
const panY = ref(40)
const viewportRef = ref<HTMLElement | null>(null)
const previewStepId = ref<string | null>(null)
const canvasInspectorOpen = ref(true)
const previewChatMessages = ref<PreviewChatMessage[]>([])
const previewReply = ref('')
const previewCurrentStepId = ref<string | null>(null)
const previewLanguageSelected = ref(false)
const stepCardWidth = 520
const stepCardHeight = 188
const canvasPadding = 520

const history = ref<HistorySnapshot[]>([])
const historyIndex = ref(-1)
const workflowPersistenceReady = ref(false)

let idCounter = 100
const nextId = (prefix: string) => `${prefix}-${idCounter++}`
let workflowPersistTimer: ReturnType<typeof setTimeout> | null = null

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function makeLocalizedText(en = '', es = ''): LocalizedText {
  return { en, es }
}

const dragState = ref<{
  mode: 'none' | 'canvas' | 'step'
  stepId: string | null
  startX: number
  startY: number
  originPanX: number
  originPanY: number
  originStepX: number
  originStepY: number
}>({
  mode: 'none',
  stepId: null,
  startX: 0,
  startY: 0,
  originPanX: 0,
  originPanY: 0,
  originStepX: 0,
  originStepY: 0,
})

function makeTriggerStep(): WorkflowStep {
  return {
    id: 'step-trigger',
    type: 'trigger',
    title: 'SMS Keyword Trigger',
    keyword: 'HELP',
    content: makeLocalizedText(),
    nextStepId: 'step-initial',
    options: [],
    x: 270,
    y: 70,
  }
}

function makeMessageStep(id: string, title: string, text: string, x: number, y: number, nextStepId: string | null): WorkflowStep {
  return {
    id,
    type: 'message',
    title,
    keyword: '',
    content: makeLocalizedText(text, ''),
    nextStepId,
    options: [],
    x,
    y,
  }
}

function makeMenuStep(): WorkflowStep {
  return {
    id: 'step-menu',
    type: 'menu',
    title: 'Support Menu',
    keyword: '',
    content: makeLocalizedText(
      'Reply 1 for calming tips, 2 for a follow-up check-in, or 9 for emergency support.',
      ''
    ),
    nextStepId: null,
    options: [
      { id: 'option-calm', label: makeLocalizedText('Calming Tips', ''), replyValue: '1', targetStepId: 'step-calm' },
      { id: 'option-checkin', label: makeLocalizedText('Follow-Up Check-In', ''), replyValue: '2', targetStepId: 'step-follow-up' },
      { id: 'option-emergency', label: makeLocalizedText('Emergency Support', ''), replyValue: '9', targetStepId: 'step-emergency' },
    ],
    x: 270,
    y: 500,
  }
}

function makeEndStep(id: string, title: string, x: number, y: number): WorkflowStep {
  return {
    id,
    type: 'end',
    title,
    keyword: '',
    content: makeLocalizedText(),
    nextStepId: null,
    options: [],
    x,
    y,
  }
}

const flows = ref<WorkflowFlow[]>([
  {
    id: 'flow-help',
    name: 'COPE Bilingual Support Flow',
    description: 'Language selection, caregiver support menus, and emergency guidance in English and Spanish.',
    status: 'draft',
    publishedAt: null,
    selectedStepId: 'step-language-selection',
    steps: [
      {
        id: 'trigger-cope',
        type: 'trigger',
        title: 'Welcome Trigger',
        keyword: 'COPE',
        content: makeLocalizedText(),
        nextStepId: 'step-language-selection',
        options: [],
        x: 520,
        y: 60,
      },
      {
        id: 'trigger-help-global',
        type: 'trigger',
        title: 'Global Help Keyword',
        keyword: 'HELP',
        content: makeLocalizedText(),
        nextStepId: 'step-help-menu',
        options: [],
        x: 40,
        y: 60,
      },
      {
        id: 'trigger-menu-global',
        type: 'trigger',
        title: 'Global Menu Keyword',
        keyword: 'MENU',
        content: makeLocalizedText(),
        nextStepId: 'step-main-menu',
        options: [],
        x: 280,
        y: 60,
      },
      {
        id: 'trigger-emergency-global',
        type: 'trigger',
        title: 'Global Emergency Keyword',
        keyword: 'EMERGENCY',
        content: makeLocalizedText(),
        nextStepId: 'step-emergency-menu',
        options: [],
        x: 760,
        y: 60,
      },
      {
        id: 'trigger-stop-global',
        type: 'trigger',
        title: 'Global Stop Keyword',
        keyword: 'STOP',
        content: makeLocalizedText(),
        nextStepId: 'step-stop-end',
        options: [],
        x: 1000,
        y: 60,
      },
      {
        id: 'step-language-selection',
        type: 'menu',
        title: 'Language Selection',
        keyword: '',
        content: makeLocalizedText(
          'Welcome! We are Shaken Baby Alliance and we are here to help.\nPlease select your language:\n1. English\n2. Spanish\n\nBienvenido! Somos Shaken Baby Alliance y estamos aqui para ayudar.\nPor favor seleccione su idioma:\n1. Ingles\n2. Espanol',
          'Welcome! We are Shaken Baby Alliance and we are here to help.\nPlease select your language:\n1. English\n2. Spanish\n\nBienvenido! Somos Shaken Baby Alliance y estamos aqui para ayudar.\nPor favor seleccione su idioma:\n1. Ingles\n2. Espanol'
        ),
        nextStepId: null,
        options: [
          { id: 'option-language-english', label: makeLocalizedText('English', 'Ingles'), replyValue: '1', targetStepId: 'step-main-menu' },
          { id: 'option-language-spanish', label: makeLocalizedText('Spanish', 'Espanol'), replyValue: '2', targetStepId: 'step-main-menu' },
        ],
        x: 520,
        y: 220,
      },
      {
        id: 'step-main-menu',
        type: 'menu',
        title: 'Main Menu',
        keyword: '',
        content: makeLocalizedText(
          'How can we help you today?\n1. Help\n2. Emergency',
          'Como podemos ayudarle hoy?\n1. Ayuda\n2. Emergencia'
        ),
        nextStepId: null,
        options: [
          { id: 'option-main-help', label: makeLocalizedText('Help', 'Ayuda'), replyValue: '1', targetStepId: 'step-help-menu' },
          { id: 'option-main-emergency', label: makeLocalizedText('Emergency', 'Emergencia'), replyValue: '2', targetStepId: 'step-emergency-menu' },
        ],
        x: 520,
        y: 430,
      },
      {
        id: 'step-help-menu',
        type: 'menu',
        title: 'Help Menu',
        keyword: '',
        content: makeLocalizedText(
          "I'm here to support you. Choose an option:\n1. I feel overwhelmed\n2. Baby won't stop crying\n3. I feel angry or frustrated\n4. I need parenting tips",
          'Estoy aqui para apoyarle. Elija una opcion:\n1. Me siento abrumado/a\n2. El bebe no deja de llorar\n3. Me siento enojado/a o frustrado/a\n4. Necesito consejos para cuidar al bebe'
        ),
        nextStepId: null,
        options: [
          { id: 'option-help-overwhelmed', label: makeLocalizedText('I feel overwhelmed', 'Me siento abrumado/a'), replyValue: '1', targetStepId: 'step-overwhelmed-1' },
          { id: 'option-help-crying', label: makeLocalizedText("Baby won't stop crying", 'El bebe no deja de llorar'), replyValue: '2', targetStepId: 'step-crying-1' },
          { id: 'option-help-angry', label: makeLocalizedText('I feel angry or frustrated', 'Me siento enojado/a o frustrado/a'), replyValue: '3', targetStepId: 'step-angry-1' },
          { id: 'option-help-parenting', label: makeLocalizedText('I need parenting tips', 'Necesito consejos para cuidar al bebe'), replyValue: '4', targetStepId: 'step-parenting-menu' },
        ],
        x: 220,
        y: 660,
      },
      {
        id: 'step-emergency-menu',
        type: 'menu',
        title: 'Emergency Menu',
        keyword: '',
        content: makeLocalizedText(
          'Call 911 immediately if emergency.\n1. Talk to someone\n2. Calming steps',
          'Llame al 911 inmediatamente si es emergencia.\n1. Hablar con alguien\n2. Pasos para calmarse'
        ),
        nextStepId: null,
        options: [
          { id: 'option-emergency-support', label: makeLocalizedText('Talk to someone', 'Hablar con alguien'), replyValue: '1', targetStepId: 'step-support' },
          { id: 'option-emergency-calming', label: makeLocalizedText('Calming steps', 'Pasos para calmarse'), replyValue: '2', targetStepId: 'step-calming' },
        ],
        x: 820,
        y: 660,
      },
      {
        id: 'step-overwhelmed-1',
        type: 'message',
        title: 'Overwhelmed Step 1',
        keyword: '',
        content: makeLocalizedText(
          "It's okay to feel overwhelmed. You're doing your best.",
          'Esta bien sentirse abrumado/a. Esta haciendo lo mejor que puede.'
        ),
        nextStepId: 'step-overwhelmed-2',
        options: [],
        x: 0,
        y: 920,
      },
      {
        id: 'step-overwhelmed-2',
        type: 'message',
        title: 'Overwhelmed Step 2',
        keyword: '',
        content: makeLocalizedText(
          'Put the baby in a safe place, like a crib, and step away.',
          'Ponga al bebe en un lugar seguro, como una cuna, y alejese.'
        ),
        nextStepId: 'step-overwhelmed-3',
        options: [],
        x: 0,
        y: 1140,
      },
      {
        id: 'step-overwhelmed-3',
        type: 'message',
        title: 'Overwhelmed Step 3',
        keyword: '',
        content: makeLocalizedText(
          'Take 10 slow breaths.',
          'Respire lentamente 10 veces.'
        ),
        nextStepId: 'step-overwhelmed-4',
        options: [],
        x: 0,
        y: 1360,
      },
      {
        id: 'step-overwhelmed-4',
        type: 'menu',
        title: 'Overwhelmed Support Options',
        keyword: '',
        content: makeLocalizedText(
          'Need more help?\n1. Talk to someone\n2. More calming tips',
          'Necesita mas ayuda?\n1. Hablar con alguien\n2. Mas consejos para calmarse'
        ),
        nextStepId: null,
        options: [
          { id: 'option-overwhelmed-support', label: makeLocalizedText('Talk to someone', 'Hablar con alguien'), replyValue: '1', targetStepId: 'step-support' },
          { id: 'option-overwhelmed-calming', label: makeLocalizedText('More calming tips', 'Mas consejos para calmarse'), replyValue: '2', targetStepId: 'step-calming' },
        ],
        x: 0,
        y: 1580,
      },
      {
        id: 'step-crying-1',
        type: 'message',
        title: 'Crying Step 1',
        keyword: '',
        content: makeLocalizedText(
          'Babies cry. It is normal.',
          'Los bebes lloran. Es normal.'
        ),
        nextStepId: 'step-crying-2',
        options: [],
        x: 260,
        y: 920,
      },
      {
        id: 'step-crying-2',
        type: 'message',
        title: 'Crying Step 2',
        keyword: '',
        content: makeLocalizedText(
          'Check basics:\n- Feeding\n- Diaper\n- Sleep',
          'Revise lo basico:\n- Alimentacion\n- Panal\n- Sueno'
        ),
        nextStepId: 'step-crying-3',
        options: [],
        x: 260,
        y: 1140,
      },
      {
        id: 'step-crying-3',
        type: 'message',
        title: 'Crying Step 3',
        keyword: '',
        content: makeLocalizedText(
          'Try soothing:\n- Rock gently\n- Soft sounds\n- Swaddle',
          'Intente calmar:\n- Mezalo suavemente\n- Sonidos suaves\n- Envuelvalo'
        ),
        nextStepId: 'step-crying-4',
        options: [],
        x: 260,
        y: 1360,
      },
      {
        id: 'step-crying-4',
        type: 'menu',
        title: 'Crying Follow-Up',
        keyword: '',
        content: makeLocalizedText(
          'Still crying?\n1. More tips\n2. Take a safe break',
          'Todavia llora?\n1. Mas consejos\n2. Tome un descanso seguro'
        ),
        nextStepId: null,
        options: [
          { id: 'option-crying-tips', label: makeLocalizedText('More tips', 'Mas consejos'), replyValue: '1', targetStepId: 'step-more-tips' },
          { id: 'option-crying-break', label: makeLocalizedText('Take a safe break', 'Tome un descanso seguro'), replyValue: '2', targetStepId: 'step-safe-break' },
        ],
        x: 260,
        y: 1580,
      },
      {
        id: 'step-angry-1',
        type: 'message',
        title: 'Angry Step 1',
        keyword: '',
        content: makeLocalizedText(
          'Feeling angry is normal. Pause.',
          'Sentirse enojado/a es normal. Haga una pausa.'
        ),
        nextStepId: 'step-angry-2',
        options: [],
        x: 520,
        y: 920,
      },
      {
        id: 'step-angry-2',
        type: 'message',
        title: 'Angry Step 2',
        keyword: '',
        content: makeLocalizedText(
          'Put the baby in a safe place.',
          'Ponga al bebe en un lugar seguro.'
        ),
        nextStepId: 'step-angry-3',
        options: [],
        x: 520,
        y: 1140,
      },
      {
        id: 'step-angry-3',
        type: 'message',
        title: 'Angry Step 3',
        keyword: '',
        content: makeLocalizedText(
          'Step away and breathe slowly.',
          'Alejese y respire lentamente.'
        ),
        nextStepId: 'step-angry-4',
        options: [],
        x: 520,
        y: 1360,
      },
      {
        id: 'step-angry-4',
        type: 'menu',
        title: 'Angry Support Options',
        keyword: '',
        content: makeLocalizedText(
          'Choose support:\n1. Talk to someone\n2. Calming exercise',
          'Elija apoyo:\n1. Hablar con alguien\n2. Ejercicio para calmarse'
        ),
        nextStepId: null,
        options: [
          { id: 'option-angry-support', label: makeLocalizedText('Talk to someone', 'Hablar con alguien'), replyValue: '1', targetStepId: 'step-support' },
          { id: 'option-angry-calming', label: makeLocalizedText('Calming exercise', 'Ejercicio para calmarse'), replyValue: '2', targetStepId: 'step-calming' },
        ],
        x: 520,
        y: 1580,
      },
      {
        id: 'step-parenting-menu',
        type: 'menu',
        title: 'Parenting Tips Menu',
        keyword: '',
        content: makeLocalizedText(
          'Choose tips:\n1. Sleep tips\n2. Feeding tips\n3. Soothing tips\n4. Safety tips',
          'Elija consejos:\n1. Dormir\n2. Alimentacion\n3. Calmar\n4. Seguridad'
        ),
        nextStepId: null,
        options: [
          { id: 'option-parenting-sleep', label: makeLocalizedText('Sleep tips', 'Dormir'), replyValue: '1', targetStepId: 'step-sleep-tips' },
          { id: 'option-parenting-feeding', label: makeLocalizedText('Feeding tips', 'Alimentacion'), replyValue: '2', targetStepId: 'step-feeding-tips' },
          { id: 'option-parenting-soothing', label: makeLocalizedText('Soothing tips', 'Calmar'), replyValue: '3', targetStepId: 'step-soothing-tips' },
          { id: 'option-parenting-safety', label: makeLocalizedText('Safety tips', 'Seguridad'), replyValue: '4', targetStepId: 'step-safety-tips' },
        ],
        x: 780,
        y: 920,
      },
      {
        id: 'step-support',
        type: 'message',
        title: 'Support Step',
        keyword: '',
        content: makeLocalizedText(
          'Call or text 988 for support.',
          'Llame o envie mensaje al 988 para apoyo.'
        ),
        nextStepId: null,
        options: [],
        x: 1040,
        y: 1140,
      },
      {
        id: 'step-calming',
        type: 'message',
        title: 'Calming Step',
        keyword: '',
        content: makeLocalizedText(
          'Take a deep breath. Inhale 4 sec, hold, exhale.',
          'Respire profundo. Inhale 4 seg, mantenga, exhale.'
        ),
        nextStepId: null,
        options: [],
        x: 1040,
        y: 1360,
      },
      {
        id: 'step-more-tips',
        type: 'message',
        title: 'More Tips Step',
        keyword: '',
        content: makeLocalizedText(
          'Try one method at a time. Ask for help if needed.',
          'Intente un metodo a la vez. Pida ayuda si es necesario.'
        ),
        nextStepId: null,
        options: [],
        x: 260,
        y: 1800,
      },
      {
        id: 'step-safe-break',
        type: 'message',
        title: 'Safe Break Step',
        keyword: '',
        content: makeLocalizedText(
          'Place baby safely and take a short break.',
          'Coloque al bebe seguro y tome un descanso.'
        ),
        nextStepId: null,
        options: [],
        x: 460,
        y: 1800,
      },
      {
        id: 'step-sleep-tips',
        type: 'message',
        title: 'Sleep Tips Step',
        keyword: '',
        content: makeLocalizedText(
          'Keep routine, dim lights, calm environment.',
          'Mantenga rutina, luz baja, ambiente tranquilo.'
        ),
        nextStepId: null,
        options: [],
        x: 780,
        y: 1140,
      },
      {
        id: 'step-feeding-tips',
        type: 'message',
        title: 'Feeding Tips Step',
        keyword: '',
        content: makeLocalizedText(
          'Feed regularly and burp gently.',
          'Alimente regularmente y saque gases.'
        ),
        nextStepId: null,
        options: [],
        x: 780,
        y: 1360,
      },
      {
        id: 'step-soothing-tips',
        type: 'message',
        title: 'Soothing Tips Step',
        keyword: '',
        content: makeLocalizedText(
          'Hold gently and reduce noise.',
          'Sostenga suavemente y reduzca ruido.'
        ),
        nextStepId: null,
        options: [],
        x: 780,
        y: 1580,
      },
      {
        id: 'step-safety-tips',
        type: 'message',
        title: 'Safety Tips Step',
        keyword: '',
        content: makeLocalizedText(
          'Never shake the baby. Always safe sleep.',
          'Nunca sacuda al bebe. Sueno seguro siempre.'
        ),
        nextStepId: null,
        options: [],
        x: 780,
        y: 1800,
      },
      {
        id: 'step-stop-end',
        type: 'end',
        title: 'Conversation Ended',
        keyword: '',
        content: makeLocalizedText(),
        nextStepId: null,
        options: [],
        x: 1000,
        y: 220,
      },
    ],
  },
  {
    id: 'flow-welcome',
    name: 'New Caregiver Welcome',
    description: 'Draft welcome sequence for first-time caregivers.',
    status: 'draft',
    publishedAt: null,
    selectedStepId: 'welcome-trigger',
    steps: [
      {
        id: 'welcome-trigger',
        type: 'trigger',
        title: 'Welcome Trigger',
        keyword: 'COPE',
        content: makeLocalizedText(),
        nextStepId: 'welcome-message',
        options: [],
        x: 270,
        y: 90,
      },
      makeMessageStep(
        'welcome-message',
        'Welcome Message',
        'Welcome to COPE. We are here to support you with calm, practical guidance whenever you need it.',
        270,
        300,
        null
      ),
    ],
  },
])

const { data: workflowData, error: workflowLoadError } = await useFetch<{ flows: WorkflowFlow[] }>('/api/workflows')
if (workflowLoadError.value) {
  console.error('Failed to load workflows from the backend', workflowLoadError.value)
} else if (workflowData.value?.flows?.length) {
  flows.value = workflowData.value.flows
}

const activeFlowId = ref(flows.value[0]?.id || 'flow-help')
const newFlowName = ref('')
const newFlowDescription = ref('')

const activeFlow = computed(() => flows.value.find((flow) => flow.id === activeFlowId.value) || flows.value[0] || null)
const previewCurrentStep = computed(() => activeFlow.value?.steps.find((step) => step.id === previewCurrentStepId.value) || null)
const previewTriggerKeyword = computed(() => activeFlow.value?.steps.find((step) => step.type === 'trigger')?.keyword || 'START')
const selectedStep = computed(() => {
  if (!activeFlow.value) return null
  return activeFlow.value.steps.find((step) => step.id === activeFlow.value.selectedStepId) || activeFlow.value.steps[0] || null
})

const orderedSteps = computed(() => [...(activeFlow.value?.steps || [])].sort((a, b) => a.y - b.y))
const allStepTargets = computed(() => (activeFlow.value?.steps || []).map((step) => ({ label: step.title, value: step.id })))
const previewStep = computed(() => activeFlow.value?.steps.find((step) => step.id === previewStepId.value) || null)
const canvasHeightClass = computed(() => {
  if (workflowCanvasMaximized.value) return 'h-screen min-h-screen'
  if (workflowMaximized.value) return 'h-[calc(100vh-220px)] min-h-[720px]'
  return 'h-[900px] xl:h-[980px]'
})

const canvasMetrics = computed(() => {
  const steps = activeFlow.value?.steps || []
  if (!steps.length) {
    return {
      minX: 0,
      minY: 0,
      width: 2200,
      height: 1800,
      offsetX: canvasPadding,
      offsetY: canvasPadding,
    }
  }

  const minX = Math.min(...steps.map((step) => step.x)) - 360
  const minY = Math.min(...steps.map((step) => step.y)) - 320
  const maxX = Math.max(...steps.map((step) => step.x + stepCardWidth)) + 520
  const maxY = Math.max(...steps.map((step) => step.y + stepCardHeight)) + 520

  return {
    minX,
    minY,
    width: Math.max(2200, maxX - minX + canvasPadding * 2),
    height: Math.max(1800, maxY - minY + canvasPadding * 2),
    offsetX: -minX + canvasPadding,
    offsetY: -minY + canvasPadding,
  }
})

const canvasBounds = computed(() => ({
  width: canvasMetrics.value.width,
  height: canvasMetrics.value.height,
}))

const canvasStyle = computed(() => ({
  width: `${canvasBounds.value.width}px`,
  height: `${canvasBounds.value.height}px`,
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`,
  transformOrigin: '0 0',
}))

const connectors = computed(() => {
  const steps = activeFlow.value?.steps || []
  const stepMap = new Map(steps.map((step) => [step.id, step]))
  const lines: Array<{ id: string; path: string; label?: string; labelX?: number; labelY?: number }> = []

  for (const step of steps) {
    if (step.type === 'menu') {
      step.options.forEach((option, index) => {
        if (!option.targetStepId) return
        const target = stepMap.get(option.targetStepId)
        if (!target) return
        const startX = step.x + canvasMetrics.value.offsetX + 260
        const startY = step.y + canvasMetrics.value.offsetY + 188
        const targetX = target.x + canvasMetrics.value.offsetX + 260
        const targetY = target.y + canvasMetrics.value.offsetY
        const bendX = step.x + 110 + index * 150
        const path = `M ${startX} ${startY} C ${bendX + canvasMetrics.value.offsetX} ${startY + 110}, ${targetX} ${targetY - 100}, ${targetX} ${targetY}`
        lines.push({
          id: `${step.id}-${option.id}`,
          path,
          label: option.replyValue,
          labelX: (startX + targetX) / 2,
          labelY: (startY + targetY) / 2 - 18,
        })
      })
      continue
    }

    if (!step.nextStepId) continue
    const target = stepMap.get(step.nextStepId)
    if (!target) continue
    const startX = step.x + canvasMetrics.value.offsetX + 260
    const startY = step.y + canvasMetrics.value.offsetY + 188
    const targetX = target.x + canvasMetrics.value.offsetX + 260
    const targetY = target.y + canvasMetrics.value.offsetY
    const midY = startY + (targetY - startY) / 2
    const path = `M ${startX} ${startY} C ${startX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`
    lines.push({ id: `${step.id}-${target.id}`, path })
  }

  return lines
})

function snapshot(): HistorySnapshot {
  return {
    flows: deepClone(flows.value),
    activeFlowId: activeFlowId.value,
    locale: locale.value,
    zoom: zoom.value,
    panX: panX.value,
    panY: panY.value,
  }
}

function saveHistory() {
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(snapshot())
  historyIndex.value = history.value.length - 1
}

async function persistWorkflows() {
  try {
    await $fetch('/api/workflows', {
      method: 'PUT',
      body: {
        flows: deepClone(flows.value),
      },
    })
  } catch (error) {
    console.error('Failed to persist workflows', error)
    showToast('Failed to save workflow changes', 'error')
  }
}

function scheduleWorkflowPersistence() {
  if (!workflowPersistenceReady.value) return
  if (workflowPersistTimer) clearTimeout(workflowPersistTimer)
  workflowPersistTimer = setTimeout(() => {
    persistWorkflows()
  }, 500)
}

function applySnapshot(state: HistorySnapshot) {
  flows.value = deepClone(state.flows)
  activeFlowId.value = state.activeFlowId
  locale.value = state.locale
  zoom.value = state.zoom
  panX.value = state.panX
  panY.value = state.panY
}

function undo() {
  if (historyIndex.value <= 0) return
  historyIndex.value -= 1
  applySnapshot(history.value[historyIndex.value])
  showToast('Undid the last workflow change', 'success')
}

function redo() {
  if (historyIndex.value >= history.value.length - 1) return
  historyIndex.value += 1
  applySnapshot(history.value[historyIndex.value])
  showToast('Restored the next workflow change', 'success')
}

function currentText(step: WorkflowStep, language = locale.value) {
  return step.content[language]
}

function optionText(option: StepOption, language = locale.value) {
  return option.label[language]
}

function previewText(step: WorkflowStep) {
  return currentText(step, previewLocale.value)
}

function previewOptionText(option: StepOption) {
  return optionText(option, previewLocale.value)
}

function previewCopy(en: string, es: string) {
  return previewLocale.value === 'es' ? es : en
}

function exportText(step: WorkflowStep, language: LocaleKey) {
  return currentText(step, language)
}

function exportOptionText(option: StepOption, language: LocaleKey) {
  return optionText(option, language)
}

function findStep(stepId: string | null) {
  if (!stepId || !activeFlow.value) return null
  return activeFlow.value.steps.find((step) => step.id === stepId) || null
}

function stepTypeLabel(type: StepType) {
  if (type === 'trigger') return 'Trigger'
  if (type === 'message') return 'Message'
  if (type === 'menu') return 'Menu'
  return 'End'
}

function stepTheme(type: StepType) {
  if (type === 'trigger') {
    return {
      border: 'border-[#8de8df]',
      shadow: 'shadow-[0_24px_50px_rgba(20,184,166,0.16)]',
      iconBg: 'bg-[linear-gradient(135deg,#14b8a6,#0f766e)]',
      pill: 'border-[#99f6e4] bg-[#ecfeff] text-[#0f766e]',
      icon: 'i-heroicons-bolt-20-solid',
    }
  }

  if (type === 'menu') {
    return {
      border: 'border-[#93c5fd]',
      shadow: 'shadow-[0_24px_50px_rgba(59,130,246,0.14)]',
      iconBg: 'bg-[linear-gradient(135deg,#3b82f6,#2563eb)]',
      pill: 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]',
      icon: 'i-heroicons-bars-3-bottom-left-20-solid',
    }
  }

  if (type === 'end') {
    return {
      border: 'border-[#9ae6b4]',
      shadow: 'shadow-[0_24px_50px_rgba(16,185,129,0.14)]',
      iconBg: 'bg-[linear-gradient(135deg,#10b981,#059669)]',
      pill: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]',
      icon: 'i-heroicons-check-circle-20-solid',
    }
  }

  return {
    border: 'border-[#d8b4fe]',
    shadow: 'shadow-[0_24px_50px_rgba(168,85,247,0.14)]',
    iconBg: 'bg-[linear-gradient(135deg,#a855f7,#7c3aed)]',
    pill: 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]',
    icon: 'i-heroicons-chat-bubble-left-right-20-solid',
  }
}

function stepTargetName(stepId: string | null) {
  if (!stepId || !activeFlow.value) return 'No target step'
  return activeFlow.value.steps.find((step) => step.id === stepId)?.title || 'Unknown step'
}

function addPreviewChatMessage(role: PreviewChatMessage['role'], text: string, stepId: string | null = null) {
  previewChatMessages.value.push({
    id: nextId('preview-message'),
    role,
    text,
    stepId,
  })
}

function startPreviewConversation(stepId?: string | null) {
  const startingStep =
    findStep(stepId || null)
    || activeFlow.value?.steps.find((step) => step.type === 'trigger')
    || orderedSteps.value[0]
    || null

  previewChatMessages.value = []
  previewReply.value = ''
  previewCurrentStepId.value = null
  previewLocale.value = locale.value
  previewLanguageSelected.value = false

  if (!startingStep) return

  if (startingStep.type === 'trigger') {
    addPreviewChatMessage('system', `Keyword ${startingStep.keyword || 'START'} triggered this workflow.`, startingStep.id)
    if (startingStep.nextStepId) {
      runPreviewFlowFrom(startingStep.nextStepId)
      return
    }
  }

  runPreviewFlowFrom(startingStep.id)
}

function runPreviewFlowFrom(stepId: string | null) {
  let cursor = findStep(stepId)

  while (cursor) {
    previewStepId.value = cursor.id

    if (cursor.type === 'trigger') {
      addPreviewChatMessage('system', `Keyword ${cursor.keyword || 'START'} triggered this workflow.`, cursor.id)
      cursor = findStep(cursor.nextStepId)
      continue
    }

    if (cursor.type === 'end') {
      addPreviewChatMessage('system', cursor.title, cursor.id)
      previewCurrentStepId.value = null
      return
    }

    addPreviewChatMessage('bot', previewText(cursor) || 'No message configured yet for this language.', cursor.id)

    if (cursor.type === 'menu') {
      previewCurrentStepId.value = cursor.id
      return
    }

    if (!cursor.nextStepId) {
      previewCurrentStepId.value = null
      return
    }

    cursor = findStep(cursor.nextStepId)
  }

  previewCurrentStepId.value = null
}

function resolvePreviewReply(step: WorkflowStep, reply: string) {
  const normalizedReply = reply.trim().toLowerCase()
  return step.options.find((option) => {
    const english = option.label.en.trim().toLowerCase()
    const spanish = option.label.es.trim().toLowerCase()
    return option.replyValue.trim().toLowerCase() === normalizedReply
      || (english && english === normalizedReply)
      || (spanish && spanish === normalizedReply)
  }) || null
}

function triggerPreviewKeyword(keyword: string) {
  const keywordMap: Record<string, string> = {
    COPE: 'trigger-cope',
    HELP: 'trigger-help-global',
    MENU: 'trigger-menu-global',
    EMERGENCY: 'trigger-emergency-global',
    STOP: 'trigger-stop-global',
  }

  const triggerId = keywordMap[keyword.toUpperCase()]
  if (!triggerId) return false

  if (!previewLanguageSelected.value && keyword.toUpperCase() !== 'STOP' && keyword.toUpperCase() !== 'COPE') {
    runPreviewFlowFrom('step-language-selection')
    return true
  }

  runPreviewFlowFrom(triggerId)
  return true
}

function repeatPreviewMenu(step: WorkflowStep) {
  addPreviewChatMessage('system', previewCopy(
    'Please reply with one of the listed numbers.',
    'Por favor responda con uno de los numeros indicados.'
  ), step.id)
  addPreviewChatMessage('bot', previewText(step) || 'No message configured yet for this language.', step.id)
  previewCurrentStepId.value = step.id
}

function handlePreviewFallbackMessage(value: string) {
  const normalized = value.trim().toUpperCase()
  if (!normalized) return

  if (triggerPreviewKeyword(normalized)) return

  if (!previewLanguageSelected.value) {
    addPreviewChatMessage('system', previewCopy(
      "Let's get you started. Please choose your language first.",
      'Vamos a comenzar. Primero elija su idioma.'
    ))
    runPreviewFlowFrom('step-language-selection')
    return
  }

  addPreviewChatMessage('system', previewCopy(
    'I did not recognize that message. Here is the main menu.',
    'No reconoci ese mensaje. Aqui esta el menu principal.'
  ))
  runPreviewFlowFrom('step-main-menu')
}

function sendPreviewReply(reply?: string) {
  const value = (reply ?? previewReply.value).trim()
  if (!value) return

  const step = previewCurrentStep.value
  addPreviewChatMessage('user', value, step?.id || null)
  previewReply.value = ''

  if (!step || step.type !== 'menu') {
    handlePreviewFallbackMessage(value)
    return
  }

  const matched = resolvePreviewReply(step, value)
  if (!matched) {
    repeatPreviewMenu(step)
    return
  }

  if (step.id === 'step-language-selection') {
    previewLocale.value = matched.replyValue === '2' ? 'es' : 'en'
    previewLanguageSelected.value = true
  }

  runPreviewFlowFrom(matched.targetStepId)
}

function selectFlow(flowId: string) {
  activeFlowId.value = flowId
  inspectorTab.value = 'content'
  createFlowOpen.value = false
  previewStepId.value = null
  libraryPanelOpen.value = false
  flowMenuOpenId.value = null
  exportMenuOpen.value = false
}

function selectStep(stepId: string) {
  if (!activeFlow.value) return
  activeFlow.value.selectedStepId = stepId
  previewStepId.value = stepId
  if (workflowCanvasMaximized.value) canvasInspectorOpen.value = true
  inspectorTab.value = selectedStep.value?.type === 'menu' ? 'options' : 'content'
}

function createFlow() {
  const name = newFlowName.value.trim()
  if (!name) return

  const triggerId = nextId('step-trigger')
  const messageId = nextId('step-message')
  const flowId = nextId('flow')
  const flow: WorkflowFlow = {
    id: flowId,
    name,
    description: newFlowDescription.value.trim() || 'New draft workflow',
    status: 'draft',
    publishedAt: null,
    selectedStepId: triggerId,
    steps: [
      {
        id: triggerId,
        type: 'trigger',
        title: 'New Trigger',
        keyword: 'START',
        content: makeLocalizedText(),
        nextStepId: messageId,
        options: [],
        x: 270,
        y: 70,
      },
      {
        id: messageId,
        type: 'message',
        title: 'First Message',
        keyword: '',
        content: makeLocalizedText('Add your first SMS message here.', ''),
        nextStepId: null,
        options: [],
        x: 270,
        y: 300,
      },
    ],
  }

  flows.value.unshift(flow)
  activeFlowId.value = flowId
  createFlowOpen.value = false
  newFlowName.value = ''
  newFlowDescription.value = ''
  fitCanvas()
  saveHistory()
  showToast('New workflow draft created', 'success')
}

function duplicateFlow() {
  if (!activeFlow.value) return
  const copied = deepClone(activeFlow.value) as WorkflowFlow
  copied.id = nextId('flow')
  copied.name = `${activeFlow.value.name} Copy`
  copied.status = 'draft'
  copied.publishedAt = null
  copied.steps = copied.steps.map((step) => ({
    ...step,
    id: nextId('step'),
    options: step.options.map((option) => ({ ...option, id: nextId('option') })),
  }))

  const stepIdMap = new Map(activeFlow.value.steps.map((step, index) => [step.id, copied.steps[index].id]))
  copied.steps.forEach((step, index) => {
    const source = activeFlow.value!.steps[index]
    step.nextStepId = source.nextStepId ? stepIdMap.get(source.nextStepId) || null : null
    step.options.forEach((option, optionIndex) => {
      const sourceOption = source.options[optionIndex]
      option.targetStepId = sourceOption?.targetStepId ? stepIdMap.get(sourceOption.targetStepId) || null : null
    })
  })

  copied.selectedStepId = copied.steps[0]?.id || ''
  flows.value.unshift(copied)
  activeFlowId.value = copied.id
  saveHistory()
  showToast('Workflow duplicated', 'success')
}

function publishFlow() {
  if (!activeFlow.value) return
  activeFlow.value.status = 'published'
  activeFlow.value.publishedAt = new Date().toLocaleString()
  saveHistory()
  showToast('Workflow marked as published in the UI', 'success')
}

function setFlowToDraft(flowId: string) {
  const flow = flows.value.find(item => item.id === flowId)
  if (!flow) return

  const wasPublished = flow.status === 'published'
  flow.status = 'draft'
  flow.publishedAt = null
  flowMenuOpenId.value = null
  saveHistory()
  showToast(wasPublished ? 'Workflow unpublished and saved to draft' : 'Workflow saved to draft', 'success')
}

function wrapPdfText(text: string, maxLength = 95) {
  const lines: string[] = []
  const rawLines = text.split('\n')

  for (const rawLine of rawLines) {
    const words = rawLine.split(/\s+/).filter(Boolean)
    if (!words.length) {
      lines.push('')
      continue
    }

    let current = ''
    for (const word of words) {
      const next = current ? `${current} ${word}` : word
      if (next.length > maxLength) {
        if (current) lines.push(current)
        current = word
      } else {
        current = next
      }
    }

    if (current) lines.push(current)
  }

  return lines
}

function buildFlowTreeLines(language: LocaleKey) {
  if (!activeFlow.value) return []

  const lines: string[] = []
  const stepMap = new Map(activeFlow.value.steps.map((step) => [step.id, step]))
  const triggerSteps = activeFlow.value.steps
    .filter((step) => step.type === 'trigger')
    .sort((a, b) => a.x - b.x || a.y - b.y)

  const stepSummary = activeFlow.value.steps.reduce((acc, step) => {
    acc.total += 1
    if (step.type === 'menu') acc.menus += 1
    if (step.type === 'message') acc.messages += 1
    if (step.type === 'trigger') acc.triggers += 1
    if (step.type === 'end') acc.ends += 1
    acc.options += step.options.length
    return acc
  }, { total: 0, triggers: 0, menus: 0, messages: 0, ends: 0, options: 0 })

  lines.push(`${activeFlow.value.name} (${language === 'en' ? 'English' : 'Spanish'} tree)`)
  lines.push(activeFlow.value.description || 'No description')
  lines.push(`Status: ${activeFlow.value.status}`)
  lines.push(`Steps: ${stepSummary.total} | Triggers: ${stepSummary.triggers} | Menus: ${stepSummary.menus} | Messages: ${stepSummary.messages} | Ends: ${stepSummary.ends} | Options: ${stepSummary.options}`)
  lines.push('')

  const visitStep = (stepId: string | null, depth: number, ancestry: string[]) => {
    if (!stepId) {
      lines.push(`${'  '.repeat(depth)}- No linked step`)
      return
    }

    const step = stepMap.get(stepId)
    if (!step) {
      lines.push(`${'  '.repeat(depth)}- Missing step: ${stepId}`)
      return
    }

    if (ancestry.includes(step.id)) {
      lines.push(`${'  '.repeat(depth)}- ${step.title} (${stepTypeLabel(step.type)}) [loop detected]`)
      return
    }

    const nextAncestry = [...ancestry, step.id]
    const indent = '  '.repeat(depth)
    const header = `${indent}- ${step.title} [${stepTypeLabel(step.type)}]`
    lines.push(header)

    if (step.type === 'trigger') {
      lines.push(`${indent}  Keyword: ${step.keyword || 'START'}`)
      visitStep(step.nextStepId, depth + 1, nextAncestry)
      return
    }

    const localizedMessage = exportText(step, language).trim()
    if (localizedMessage) {
      lines.push(`${indent}  Message:`)
      for (const wrappedLine of wrapPdfText(localizedMessage, 80)) {
        lines.push(`${indent}    ${wrappedLine}`)
      }
    } else {
      lines.push(`${indent}  Message: Not configured`)
    }

    if (step.type === 'menu') {
      lines.push(`${indent}  Options (${step.options.length}):`)
      step.options.forEach((option) => {
        const optionLabel = exportOptionText(option, language) || 'Unnamed option'
        const target = stepMap.get(option.targetStepId || '')
        lines.push(`${indent}    ${option.replyValue}. ${optionLabel} -> ${target?.title || 'No target step'}`)
        visitStep(option.targetStepId, depth + 2, nextAncestry)
      })
      return
    }

    if (step.type === 'end') {
      lines.push(`${indent}  End of flow`)
      return
    }

    if (step.nextStepId) {
      lines.push(`${indent}  Next:`)
      visitStep(step.nextStepId, depth + 1, nextAncestry)
    } else {
      lines.push(`${indent}  Next: None`)
    }
  }

  triggerSteps.forEach((trigger, index) => {
    if (index > 0) lines.push('')
    lines.push(`Trigger Tree ${index + 1}`)
    visitStep(trigger.id, 0, [])
  })

  return lines
}

type ExportTreeNode = {
  id: string
  title: string
  subtitle: string
  children: Array<{ edgeLabel: string; node: ExportTreeNode }>
}

type PositionedExportTreeNode = ExportTreeNode & {
  width: number
  x: number
  y: number
  children: Array<{ edgeLabel: string; node: PositionedExportTreeNode }>
}

function exportNodeTitle(step: WorkflowStep) {
  if (step.type === 'trigger') return step.title
  if (step.type === 'menu') return step.title
  if (step.type === 'end') return step.title
  return step.title
}

function exportNodeSubtitle(step: WorkflowStep, language: LocaleKey) {
  if (step.type === 'trigger') return `Keyword: ${step.keyword || 'START'}`
  if (step.type === 'end') return 'End of flow'

  const text = exportText(step, language).replace(/\s+/g, ' ').trim()
  const preview = text.length > 58 ? `${text.slice(0, 55)}...` : text

  if (step.type === 'menu') {
    return `${step.options.length} options${preview ? ` | ${preview}` : ''}`
  }

  return preview || 'No message configured'
}

function buildExportTree(stepId: string | null, language: LocaleKey, ancestry: string[] = []): ExportTreeNode | null {
  if (!activeFlow.value || !stepId) return null

  const step = activeFlow.value.steps.find((item) => item.id === stepId)
  if (!step) {
    return {
      id: `missing-${stepId}`,
      title: 'Missing Step',
      subtitle: stepId,
      children: [],
    }
  }

  if (ancestry.includes(step.id)) {
    return {
      id: `${step.id}-loop`,
      title: step.title,
      subtitle: 'Loop detected',
      children: [],
    }
  }

  const nextAncestry = [...ancestry, step.id]
  const node: ExportTreeNode = {
    id: step.id,
    title: exportNodeTitle(step),
    subtitle: exportNodeSubtitle(step, language),
    children: [],
  }

  if (step.type === 'menu') {
    node.children = step.options
      .map((option) => ({
        edgeLabel: `${option.replyValue}. ${exportOptionText(option, language) || 'Option'}`,
        node: buildExportTree(option.targetStepId, language, nextAncestry),
      }))
      .filter((item): item is { edgeLabel: string; node: ExportTreeNode } => Boolean(item.node))
    return node
  }

  if (step.nextStepId) {
    const child = buildExportTree(step.nextStepId, language, nextAncestry)
    if (child) {
      node.children = [{ edgeLabel: step.type === 'trigger' ? 'Start' : 'Next', node: child }]
    }
  }

  return node
}

function layoutExportTree(node: ExportTreeNode): PositionedExportTreeNode {
  const nodeWidth = 150
  const gapX = 26
  const gapY = 64

  const children = node.children.map((child) => ({
    edgeLabel: child.edgeLabel,
    node: layoutExportTree(child.node),
  }))

  const childrenWidth = children.length
    ? children.reduce((sum, child, index) => sum + child.node.width + (index > 0 ? gapX : 0), 0)
    : 0

  const width = Math.max(nodeWidth, childrenWidth)

  let cursor = 0
  const positionedChildren = children.map((child) => {
    const positioned = {
      edgeLabel: child.edgeLabel,
      node: {
        ...child.node,
        x: cursor + (child.node.width - nodeWidth) / 2,
        y: gapY,
      },
    }
    cursor += child.node.width + gapX
    return positioned
  })

  return {
    ...node,
    width,
    x: (width - nodeWidth) / 2,
    y: 0,
    children: positionedChildren,
  }
}

function renderExportTreePage(
  doc: any,
  root: PositionedExportTreeNode,
  triggerLabel: string,
  language: LocaleKey
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 34
  const titleY = 32
  const nodeWidth = 150
  const nodeHeight = 40
  const usableWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - 92

  const maxDepth = (node: PositionedExportTreeNode): number => {
    if (!node.children.length) return 1
    return 1 + Math.max(...node.children.map((child) => maxDepth(child.node)))
  }

  const treeWidth = root.width
  const treeHeight = Math.max(1, maxDepth(root)) * 64
  const scale = Math.min(usableWidth / treeWidth, usableHeight / treeHeight, 1)
  const offsetX = margin + (usableWidth - treeWidth * scale) / 2
  const offsetY = 56

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(`${triggerLabel} (${language === 'en' ? 'English' : 'Spanish'})`, margin, titleY)

  const drawNode = (node: PositionedExportTreeNode, parentX?: number, parentY?: number, edgeLabel?: string) => {
    const x = offsetX + node.x * scale
    const y = offsetY + node.y * scale
    const w = nodeWidth * scale
    const h = nodeHeight * scale
    const centerX = x + w / 2
    const topY = y
    const bottomY = y + h

    if (parentX != null && parentY != null) {
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(1)
      doc.line(parentX, parentY, parentX, topY - 8 * scale)
      doc.line(parentX, topY - 8 * scale, centerX, topY - 8 * scale)
      doc.line(centerX, topY - 8 * scale, centerX, topY)

      if (edgeLabel) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(Math.max(6, 7 * scale))
        const label = edgeLabel.length > 24 ? `${edgeLabel.slice(0, 21)}...` : edgeLabel
        doc.text(label, (parentX + centerX) / 2, topY - 12 * scale, { align: 'center' })
      }
    }

    doc.setDrawColor(212, 198, 176)
    doc.setFillColor(241, 233, 220)
    doc.roundedRect(x, y, w, h, 5 * scale, 5 * scale, 'FD')

    doc.setTextColor(69, 53, 40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(Math.max(7, 8 * scale))
    const titleLines = doc.splitTextToSize(node.title, w - 10 * scale).slice(0, 2)
    doc.text(titleLines, x + w / 2, y + 12 * scale, { align: 'center', baseline: 'top' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(Math.max(5, 6.5 * scale))
    const subtitleLines = doc.splitTextToSize(node.subtitle, w - 12 * scale).slice(0, 2)
    doc.text(subtitleLines, x + w / 2, y + 22 * scale, { align: 'center', baseline: 'top' })

    node.children.forEach((child) => {
      drawNode(
        {
          ...child.node,
          x: node.x + child.node.x,
          y: node.y + child.node.y,
        },
        centerX,
        bottomY,
        child.edgeLabel
      )
    })
  }

  drawNode(root)
}

async function exportWorkflowTreePDF(language: LocaleKey) {
  if (!activeFlow.value) return

  exportMenuOpen.value = false

  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const marginX = 40
  const marginTop = 46
  const marginBottom = 40
  let y = marginTop

  const triggerSteps = activeFlow.value.steps
    .filter((step) => step.type === 'trigger')
    .sort((a, b) => a.x - b.x || a.y - b.y)

  if (triggerSteps.length) {
    triggerSteps.forEach((trigger, index) => {
      const tree = buildExportTree(trigger.id, language)
      if (!tree) return
      if (index > 0) doc.addPage('a4', 'landscape')
      renderExportTreePage(doc, layoutExportTree(tree), trigger.title, language)
    })
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(activeFlow.value.name, marginX, marginTop)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text('No trigger steps found for diagram export.', marginX, marginTop + 24)
  }

  doc.addPage('a4', 'portrait')
  let pageWidth = doc.internal.pageSize.getWidth()
  let pageHeight = doc.internal.pageSize.getHeight()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  y = marginTop
  doc.text(`${activeFlow.value.name} Details`, marginX, y)
  y += 22
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Language appendix: ${language === 'en' ? 'English' : 'Spanish'}`, marginX, y)
  y += 22

  const lines = buildFlowTreeLines(language)
  doc.setFontSize(10)

  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line || ' ', pageWidth - marginX * 2)

    if (y + wrapped.length * 14 > pageHeight - marginBottom) {
      doc.addPage('a4', 'portrait')
      pageWidth = doc.internal.pageSize.getWidth()
      pageHeight = doc.internal.pageSize.getHeight()
      y = marginTop
    }

    doc.text(wrapped, marginX, y)
    y += wrapped.length * 14
  }

  const safeName = activeFlow.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  doc.save(`${safeName || 'workflow'}-${language}-tree.pdf`)
  showToast(`Exported ${language === 'en' ? 'English' : 'Spanish'} workflow tree PDF`, 'success')
}

function toggleFlowMenu(flowId: string) {
  flowMenuOpenId.value = flowMenuOpenId.value === flowId ? null : flowId
}

function deleteFlow(flowId?: string) {
  const targetFlowId = flowId || activeFlow.value?.id
  const targetFlow = flows.value.find((flow) => flow.id === targetFlowId)

  if (!targetFlow || flows.value.length === 1) {
    showToast('At least one workflow must remain', 'error')
    return
  }

  if (process.client) {
    const confirmed = window.confirm(`Delete "${targetFlow.name}"? This removes the flow from the builder.`)
    if (!confirmed) return
  }

  const removingId = targetFlow.id
  flows.value = flows.value.filter((flow) => flow.id !== removingId)
  if (activeFlowId.value === removingId) {
    activeFlowId.value = flows.value[0].id
  }
  flowMenuOpenId.value = null
  saveHistory()
  showToast('Workflow removed from the UI', 'success')
}

function addStep(type: StepType) {
  if (!activeFlow.value || !selectedStep.value) return

  const anchor = selectedStep.value
  const id = nextId('step')
  const step: WorkflowStep = {
    id,
    type,
    title: type === 'trigger' ? 'New Trigger' : type === 'message' ? 'New Message' : type === 'menu' ? 'New Menu' : 'New End',
    keyword: type === 'trigger' ? 'START' : '',
    content: makeLocalizedText(type === 'message' ? 'Add your SMS message here.' : '', ''),
    nextStepId: null,
    options: type === 'menu'
      ? [{ id: nextId('option'), label: makeLocalizedText('Option 1', ''), replyValue: '1', targetStepId: null }]
      : [],
    x: anchor.x,
    y: anchor.y + 230,
  }

  if (anchor.type === 'menu') {
    const emptyOption = anchor.options.find((option) => !option.targetStepId)
    if (emptyOption) emptyOption.targetStepId = id
    else {
      anchor.options.push({
        id: nextId('option'),
        label: makeLocalizedText(`Option ${anchor.options.length + 1}`, ''),
        replyValue: `${anchor.options.length + 1}`,
        targetStepId: id,
      })
    }
  } else {
    step.nextStepId = anchor.nextStepId
    anchor.nextStepId = id
  }

  activeFlow.value.steps.push(step)
  activeFlow.value.selectedStepId = id
  previewStepId.value = id
  inspectorTab.value = type === 'menu' ? 'options' : 'content'
  autoLayout()
  saveHistory()
  showToast(`${stepTypeLabel(type)} step added`, 'success')
}

function duplicateStep() {
  if (!activeFlow.value || !selectedStep.value) return
  const source = selectedStep.value
  const copy: WorkflowStep = deepClone(source)
  copy.id = nextId('step')
  copy.title = `${source.title} Copy`
  copy.x = source.x + 44
  copy.y = source.y + 44
  copy.options = source.options.map((option) => ({
    ...option,
    id: nextId('option'),
  }))
  activeFlow.value.steps.push(copy)
  activeFlow.value.selectedStepId = copy.id
  previewStepId.value = copy.id
  saveHistory()
  showToast('Step duplicated', 'success')
}

function deleteStep() {
  if (!activeFlow.value || !selectedStep.value) return
  const step = selectedStep.value
  if (step.type === 'trigger') {
    showToast('Trigger step cannot be deleted', 'error')
    return
  }

  const stepId = step.id
  const fallbackTarget = step.nextStepId
  activeFlow.value.steps = activeFlow.value.steps.filter((item) => item.id !== stepId)
  activeFlow.value.steps.forEach((item) => {
    if (item.nextStepId === stepId) item.nextStepId = fallbackTarget
    if (item.type === 'menu') {
      item.options.forEach((option) => {
        if (option.targetStepId === stepId) option.targetStepId = fallbackTarget
      })
    }
  })

  activeFlow.value.selectedStepId = activeFlow.value.steps[0]?.id || ''
  previewStepId.value = activeFlow.value.selectedStepId
  saveHistory()
  showToast('Step deleted', 'success')
}

function addOption() {
  if (!selectedStep.value || selectedStep.value.type !== 'menu') return
  selectedStep.value.options.push({
    id: nextId('option'),
    label: makeLocalizedText(`Option ${selectedStep.value.options.length + 1}`, ''),
    replyValue: `${selectedStep.value.options.length + 1}`,
    targetStepId: null,
  })
  saveHistory()
}

function removeOption(optionId: string) {
  if (!selectedStep.value || selectedStep.value.type !== 'menu') return
  selectedStep.value.options = selectedStep.value.options.filter((option) => option.id !== optionId)
  saveHistory()
}

function autoLayout() {
  if (!activeFlow.value) return
  const menus = activeFlow.value.steps.filter((step) => step.type === 'menu')
  let vertical = 90

  activeFlow.value.steps
    .filter((step) => step.type === 'trigger' || step.type === 'message' || step.type === 'menu' || step.type === 'end')
    .sort((a, b) => a.y - b.y)
    .forEach((step) => {
      if (menus.includes(step)) {
        step.x = 320
        step.y = vertical
        vertical += 250
        step.options.forEach((option, index) => {
          const target = activeFlow.value!.steps.find((item) => item.id === option.targetStepId)
          if (target) {
            target.x = 40 + index * 320
            target.y = vertical
          }
        })
        vertical += 270
        return
      }

      const usedAsBranch = activeFlow.value!.steps.some((item) => item.type === 'menu' && item.options.some((option) => option.targetStepId === step.id))
      if (!usedAsBranch) {
        step.x = 320
        step.y = vertical
        vertical += 250
      }
    })
}

function fitCanvas() {
  const viewport = viewportRef.value
  if (!viewport) {
    zoom.value = 0.75
    panX.value = 120
    panY.value = 80
    return
  }

  const viewportWidth = viewport.clientWidth
  const viewportHeight = viewport.clientHeight
  const availableWidth = Math.max(320, viewportWidth - 160)
  const availableHeight = Math.max(320, viewportHeight - 160)
  const nextZoom = Math.min(2.4, Math.max(0.15, Math.min(availableWidth / canvasBounds.value.width, availableHeight / canvasBounds.value.height)))

  zoom.value = +nextZoom.toFixed(2)
  panX.value = Math.round((viewportWidth - canvasBounds.value.width * zoom.value) / 2)
  panY.value = Math.round((viewportHeight - canvasBounds.value.height * zoom.value) / 2)
}

function setZoom(nextZoom: number, originX?: number, originY?: number) {
  const clamped = Math.min(4, Math.max(0.08, +nextZoom.toFixed(3)))
  const viewport = viewportRef.value

  if (!viewport || clamped === zoom.value) {
    zoom.value = clamped
    return
  }

  const x = originX ?? viewport.clientWidth / 2
  const y = originY ?? viewport.clientHeight / 2
  const worldX = (x - panX.value) / zoom.value
  const worldY = (y - panY.value) / zoom.value

  zoom.value = clamped
  panX.value = Math.round(x - worldX * clamped)
  panY.value = Math.round(y - worldY * clamped)
}

function zoomIn(originX?: number, originY?: number) {
  const step = zoom.value < 0.2 ? 0.04 : zoom.value < 1 ? 0.08 : zoom.value < 2 ? 0.15 : 0.25
  setZoom(zoom.value + step, originX, originY)
}

function zoomOut(originX?: number, originY?: number) {
  const step = zoom.value <= 0.2 ? 0.04 : zoom.value <= 1 ? 0.08 : zoom.value <= 2 ? 0.15 : 0.25
  setZoom(zoom.value - step, originX, originY)
}

function toggleMaximize() {
  workflowMaximized.value = !workflowMaximized.value
  nextTick(() => fitCanvas())
}

function toggleCanvasMaximize() {
  workflowCanvasMaximized.value = !workflowCanvasMaximized.value
  canvasInspectorOpen.value = workflowCanvasMaximized.value
  nextTick(() => fitCanvas())
}

function openPreview(stepId?: string) {
  previewStepId.value = stepId || selectedStep.value?.id || orderedSteps.value[0]?.id || null
  previewMode.value = 'messages'
  startPreviewConversation(stepId || null)
  previewOpen.value = true
}

function previewGoToStep(stepId: string | null) {
  if (!stepId) return
  previewStepId.value = stepId
}

function startCanvasPan(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('[data-step-card]')) return
  dragState.value = {
    mode: 'canvas',
    stepId: null,
    startX: event.clientX,
    startY: event.clientY,
    originPanX: panX.value,
    originPanY: panY.value,
    originStepX: 0,
    originStepY: 0,
  }
}

function startStepDrag(event: PointerEvent, step: WorkflowStep) {
  dragState.value = {
    mode: 'step',
    stepId: step.id,
    startX: event.clientX,
    startY: event.clientY,
    originPanX: panX.value,
    originPanY: panY.value,
    originStepX: step.x,
    originStepY: step.y,
  }
  selectStep(step.id)
}

function handlePointerMove(event: PointerEvent) {
  if (dragState.value.mode === 'canvas') {
    panX.value = dragState.value.originPanX + (event.clientX - dragState.value.startX)
    panY.value = dragState.value.originPanY + (event.clientY - dragState.value.startY)
    return
  }

  if (dragState.value.mode === 'step' && activeFlow.value) {
    const step = activeFlow.value.steps.find((item) => item.id === dragState.value.stepId)
    if (!step) return
    step.x = Math.round(dragState.value.originStepX + (event.clientX - dragState.value.startX) / zoom.value)
    step.y = Math.round(dragState.value.originStepY + (event.clientY - dragState.value.startY) / zoom.value)
  }
}

function handlePointerUp() {
  if (dragState.value.mode !== 'none') {
    dragState.value.mode = 'none'
    dragState.value.stepId = null
    saveHistory()
  }
}

function handleWheel(event: WheelEvent) {
  if (!event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  const rect = viewportRef.value?.getBoundingClientRect()
  const originX = rect ? event.clientX - rect.left : undefined
  const originY = rect ? event.clientY - rect.top : undefined
  if (event.deltaY < 0) zoomIn(originX, originY)
  else zoomOut(originX, originY)
}

watch(selectedStep, (step) => {
  if (!step) return
  if (!previewStepId.value) previewStepId.value = step.id
  inspectorTab.value = step.type === 'menu' ? 'options' : 'content'
})

watch(activeFlowId, () => {
  previewStepId.value = selectedStep.value?.id || orderedSteps.value[0]?.id || null
})

watch(
  flows,
  () => {
    if (!activeFlow.value) return
    if (!selectedStep.value && activeFlow.value.steps[0]) {
      activeFlow.value.selectedStepId = activeFlow.value.steps[0].id
    }
    if (previewStepId.value && !activeFlow.value.steps.some((step) => step.id === previewStepId.value)) {
      previewStepId.value = activeFlow.value.selectedStepId || activeFlow.value.steps[0]?.id || null
    }
    scheduleWorkflowPersistence()
  },
  { deep: true }
)

onMounted(() => {
  previewStepId.value = selectedStep.value?.id || orderedSteps.value[0]?.id || null
  saveHistory()
  workflowPersistenceReady.value = true
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
})

onBeforeUnmount(() => {
  workflowMaximized.value = false
  workflowCanvasMaximized.value = false
  if (workflowPersistTimer) clearTimeout(workflowPersistTimer)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
})
</script>

<template>
  <div
    class="workflow-page min-w-0"
    :class="workflowMaximized ? 'min-h-screen bg-[radial-gradient(circle_at_top,#edf9f7_0%,#f8fbff_52%,#ffffff_100%)] p-4 lg:p-5' : 'mx-auto max-w-[1760px] space-y-6'"
  >
    <div
      class="grid min-w-0 gap-5"
      :class="workflowMaximized
        ? 'xl:grid-cols-[minmax(0,1fr)_380px]'
        : 'xl:grid-cols-[minmax(0,1fr)_380px]'"
    >
      <div class="min-w-0 space-y-5">
        <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section class="rounded-[28px] border border-[#e7edf3] bg-white px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div class="flex flex-col gap-4">
              <div>
                <p class="text-[20px] font-bold text-[#102a43]">COPE Workflow Builder</p>
                <p class="mt-1 text-sm leading-6 text-[#64748b]">Design SMS automation flows with visual logic.</p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" :disabled="historyIndex <= 0" @click="undo">
                  Undo
                </button>
                <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" :disabled="historyIndex >= history.length - 1" @click="redo">
                  Redo
                </button>
                <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="duplicateFlow">
                  Duplicate Flow
                </button>
                <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="toggleMaximize">
                  {{ workflowMaximized ? 'Exit Full Screen' : 'Maximize Builder' }}
                </button>
                <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="openPreview()">
                  Preview
                </button>
                <div class="relative">
                  <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="exportMenuOpen = !exportMenuOpen">
                    Export PDF
                  </button>
                  <div
                    v-if="exportMenuOpen"
                    class="absolute left-0 top-12 z-20 min-w-[220px] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_16px_34px_rgba(15,23,42,0.12)]"
                  >
                    <button
                      class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]"
                      @click="exportWorkflowTreePDF('en')"
                    >
                      <UIcon name="i-heroicons-document-arrow-down-20-solid" style="width:16px;height:16px;color:#0f766e;" />
                      Export English Tree PDF
                    </button>
                    <div class="border-t border-[#edf2f7]"></div>
                    <button
                      class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]"
                      @click="exportWorkflowTreePDF('es')"
                    >
                      <UIcon name="i-heroicons-document-arrow-down-20-solid" style="width:16px;height:16px;color:#2563eb;" />
                      Export Spanish Tree PDF
                    </button>
                  </div>
                </div>
                <button class="rounded-2xl bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] px-4 py-2.5 text-sm font-semibold text-[#102a43] shadow-[0_14px_34px_rgba(251,191,36,0.18)] transition hover:brightness-95" @click="publishFlow">
                  Publish
                </button>
              </div>
            </div>
          </section>

          <section class="rounded-[28px] border border-[#e7edf3] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <button class="flex w-full items-center justify-between gap-4 px-5 py-5 text-left" @click="libraryPanelOpen = !libraryPanelOpen">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">Workflow Library</p>
                <p class="mt-2 truncate text-[18px] font-bold text-[#102a43]">{{ activeFlow?.name }}</p>
                <p class="mt-1 text-sm text-[#64748b]">{{ activeFlow?.steps.length }} steps • {{ activeFlow?.status }}</p>
              </div>
              <div class="flex items-center gap-3">
                <button class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#14b8a6,#0f766e)] text-white shadow-lg transition hover:scale-[1.03]" @click.stop="createFlowOpen = !createFlowOpen">
                  <UIcon :name="createFlowOpen ? 'i-heroicons-x-mark-20-solid' : 'i-heroicons-plus-20-solid'" style="width:18px;height:18px;" />
                </button>
                <UIcon :name="libraryPanelOpen ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" style="width:18px;height:18px;color:#64748b;" />
              </div>
            </button>

            <Transition name="flow-panel">
              <div v-if="libraryPanelOpen" class="border-t border-[#edf2f7] px-5 py-5">
                <Transition name="flow-panel">
                  <div v-if="createFlowOpen" class="mb-4 rounded-[22px] border border-[#e7edf3] bg-[#f8fbff] p-4">
                    <label class="mb-2 block text-sm font-semibold text-[#102a43]">Flow Name</label>
                    <input v-model="newFlowName" class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3 text-sm text-[#102a43] outline-none" placeholder="New caregiver workflow">
                    <label class="mb-2 mt-4 block text-sm font-semibold text-[#102a43]">Description</label>
                    <textarea v-model="newFlowDescription" rows="3" class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3 text-sm text-[#102a43] outline-none" placeholder="What is this flow for?"></textarea>
                    <button class="mt-4 w-full rounded-2xl bg-[#102a43] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2033] disabled:cursor-not-allowed disabled:opacity-60" :disabled="!newFlowName.trim()" @click="createFlow">
                      Create Draft Flow
                    </button>
                  </div>
                </Transition>

                <div class="space-y-3">
                  <div
                    v-for="flow in flows"
                    :key="flow.id"
                    class="relative w-full rounded-[22px] border px-4 py-4 text-left transition"
                    :class="activeFlowId === flow.id
                      ? 'border-[#99f6e4] bg-[linear-gradient(135deg,#effcf9,#f8fbff)] shadow-[0_16px_34px_rgba(20,184,166,0.12)]'
                      : 'border-[#edf2f7] bg-white hover:bg-[#f8fbff]'"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <button class="min-w-0 flex-1 text-left" @click="selectFlow(flow.id)">
                        <p class="text-base font-semibold text-[#102a43]">{{ flow.name }}</p>
                        <p class="mt-2 text-sm leading-6 text-[#64748b]">{{ flow.description }}</p>
                      </button>
                      <div class="relative flex items-start gap-2">
                        <span
                          class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                          :class="flow.status === 'published' ? 'bg-[#ecfdf5] text-[#047857]' : 'bg-[#fff7ed] text-[#c2410c]'"
                        >
                          {{ flow.status }}
                        </span>
                        <button
                          class="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] transition hover:bg-[#f8fafc] hover:text-[#102a43]"
                          :aria-label="`Open actions for ${flow.name}`"
                          @click.stop="toggleFlowMenu(flow.id)"
                        >
                          <UIcon name="i-heroicons-ellipsis-horizontal-20-solid" style="width:16px;height:16px;" />
                        </button>

                        <div
                          v-if="flowMenuOpenId === flow.id"
                          class="absolute right-0 top-11 z-20 min-w-[140px] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_16px_34px_rgba(15,23,42,0.12)]"
                        >
                          <button
                            class="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fafc]"
                            @click.stop="setFlowToDraft(flow.id)"
                          >
                            <UIcon
                              :name="flow.status === 'published' ? 'i-heroicons-arrow-down-circle-20-solid' : 'i-heroicons-document-20-solid'"
                              style="width:14px;height:14px;"
                            />
                            {{ flow.status === 'published' ? 'Unpublish' : 'Save to Draft' }}
                          </button>
                          <button
                            class="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-[#dc2626] transition hover:bg-[#fef2f2]"
                            @click.stop="deleteFlow(flow.id)"
                          >
                            <UIcon name="i-heroicons-trash-20-solid" style="width:14px;height:14px;" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="mt-3 flex items-center justify-between text-xs text-[#94a3b8]">
                      <span>{{ flow.steps.length }} steps</span>
                      <span>{{ flow.publishedAt || 'Not published yet' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </section>
        </div>

        <section
        class="min-w-0 overflow-hidden border border-[#e7edf3] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]"
        :class="workflowCanvasMaximized ? 'fixed inset-0 z-[90] rounded-none border-0 shadow-none' : 'rounded-[32px]'"
      >
        <div v-if="!workflowCanvasMaximized" class="border-b border-[#edf2f7] px-5 py-4">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p class="text-[18px] font-bold text-[#102a43]">{{ activeFlow?.name }}</p>
                <p class="mt-1 text-sm leading-6 text-[#64748b]">
                  Build inside the canvas, add steps from here, and use preview anytime to check how the conversation will move.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-xs font-semibold text-[#102a43]">{{ orderedSteps.length }} steps</span>
                <span class="rounded-full border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-xs font-semibold text-[#64748b]">{{ Math.round(zoom * 100) }}% zoom</span>
                <div class="inline-flex rounded-full bg-[#f8fbff] p-1">
                  <button class="rounded-full px-4 py-2 text-xs font-semibold transition" :class="locale === 'en' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="locale = 'en'">Canvas EN</button>
                  <button class="rounded-full px-4 py-2 text-xs font-semibold transition" :class="locale === 'es' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="locale = 'es'">Canvas ES</button>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="addStep('message')">
                Add Message Step
              </button>
              <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="addStep('menu')">
                Add Menu Step
              </button>
              <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="addStep('end')">
                Add End Step
              </button>
              <button class="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe3ec] bg-white text-[#102a43] transition hover:bg-[#f8fbff]" @click="zoomOut">
                <UIcon name="i-heroicons-minus-20-solid" style="width:16px;height:16px;" />
              </button>
              <button class="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe3ec] bg-white text-[#102a43] transition hover:bg-[#f8fbff]" @click="zoomIn">
                <UIcon name="i-heroicons-plus-20-solid" style="width:16px;height:16px;" />
              </button>
              <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="fitCanvas">
                Fit
              </button>
              <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="autoLayout(); saveHistory()">
                Auto Layout
              </button>
              <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="toggleCanvasMaximize">
                {{ workflowCanvasMaximized ? 'Exit Canvas Full Screen' : 'Maximize Canvas' }}
              </button>
              <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="openPreview()">
                Open Preview
              </button>
            </div>
          </div>
        </div>

        <div
          ref="viewportRef"
          class="workflow-viewport relative overflow-hidden bg-[radial-gradient(circle_at_top,#f8fffe_0%,#f8fbff_48%,#f6f8fb_100%)]"
          :class="canvasHeightClass"
          @pointerdown="startCanvasPan"
          @wheel="handleWheel"
        >
          <div v-if="workflowCanvasMaximized" class="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2">
            <button class="rounded-2xl border border-[#dbe3ec] bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#102a43] backdrop-blur transition hover:bg-white" @click="zoomOut">
              -
            </button>
            <button class="rounded-2xl border border-[#dbe3ec] bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#102a43] backdrop-blur transition hover:bg-white" @click="zoomIn">
              +
            </button>
            <button class="rounded-2xl border border-[#dbe3ec] bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#102a43] backdrop-blur transition hover:bg-white" @click="addStep('message')">
              Add Message Step
            </button>
            <button class="rounded-2xl border border-[#dbe3ec] bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#102a43] backdrop-blur transition hover:bg-white" @click="addStep('menu')">
              Add Menu Step
            </button>
            <button class="rounded-2xl border border-[#dbe3ec] bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#102a43] backdrop-blur transition hover:bg-white" @click="addStep('end')">
              Add End Step
            </button>
            <button class="rounded-2xl border border-[#dbe3ec] bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#102a43] backdrop-blur transition hover:bg-white" @click="fitCanvas">
              Fit
            </button>
            <button class="rounded-2xl border border-[#dbe3ec] bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#102a43] backdrop-blur transition hover:bg-white" @click="openPreview()">
              Preview
            </button>
            <button class="rounded-2xl border border-[#dbe3ec] bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#102a43] backdrop-blur transition hover:bg-white" @click="canvasInspectorOpen = !canvasInspectorOpen">
              {{ canvasInspectorOpen ? 'Hide Step Panel' : 'Show Step Panel' }}
            </button>
            <button class="rounded-2xl border border-[#dbe3ec] bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#102a43] backdrop-blur transition hover:bg-white" @click="toggleCanvasMaximize">
              Exit Full Screen
            </button>
          </div>

          <div
            v-if="workflowCanvasMaximized && selectedStep && canvasInspectorOpen"
            class="absolute right-4 top-4 z-20 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-[#dbe3ec] bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur"
          >
            <div class="flex items-start justify-between gap-3 border-b border-[#edf2f7] px-4 py-4">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">Step Configuration</p>
                <p class="mt-1 truncate text-lg font-bold text-[#102a43]">{{ selectedStep.title }}</p>
                <p class="text-sm text-[#64748b]">{{ stepTypeLabel(selectedStep.type) }} step</p>
              </div>
              <button class="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#dbe3ec] bg-white text-[#64748b] transition hover:bg-[#f8fbff]" @click="canvasInspectorOpen = false">
                <UIcon name="i-heroicons-x-mark-20-solid" style="width:16px;height:16px;" />
              </button>
            </div>

            <div class="max-h-[calc(100vh-7rem)] space-y-4 overflow-y-auto px-4 py-4">
              <div class="inline-flex rounded-full bg-[#f8fbff] p-1">
                <button class="rounded-full px-4 py-2 text-sm font-semibold transition" :class="inspectorTab === 'content' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="inspectorTab = 'content'">Content</button>
                <button class="rounded-full px-4 py-2 text-sm font-semibold transition" :class="inspectorTab === 'options' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="inspectorTab = 'options'">Options</button>
                <button class="rounded-full px-4 py-2 text-sm font-semibold transition" :class="inspectorTab === 'routing' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="inspectorTab = 'routing'">Routing</button>
              </div>

              <div v-if="inspectorTab === 'content'" class="space-y-4">
                <div>
                  <label class="mb-2 block text-sm font-semibold text-[#102a43]">Step Name</label>
                  <input v-model="selectedStep.title" class="w-full rounded-2xl border border-[#dbe3ec] bg-[#fbfdff] px-4 py-3 text-sm text-[#102a43] outline-none" @blur="saveHistory()">
                </div>

                <div v-if="selectedStep.type === 'trigger'">
                  <label class="mb-2 block text-sm font-semibold text-[#102a43]">Keyword</label>
                  <input v-model="selectedStep.keyword" class="w-full rounded-2xl border border-[#dbe3ec] bg-[#fbfdff] px-4 py-3 text-sm uppercase text-[#102a43] outline-none" @blur="saveHistory()">
                </div>

                <div v-if="selectedStep.type !== 'end'">
                  <label class="mb-2 block text-sm font-semibold text-[#102a43]">English Message</label>
                  <textarea v-model="selectedStep.content.en" rows="4" class="w-full rounded-[20px] border border-[#dbe3ec] bg-[#fbfdff] px-4 py-3 text-sm leading-6 text-[#102a43] outline-none" placeholder="English message..." @blur="saveHistory()"></textarea>
                </div>

                <div v-if="selectedStep.type !== 'end'">
                  <label class="mb-2 block text-sm font-semibold text-[#102a43]">Spanish Message</label>
                  <textarea v-model="selectedStep.content.es" rows="4" class="w-full rounded-[20px] border border-[#dbe3ec] bg-[#fbfdff] px-4 py-3 text-sm leading-6 text-[#102a43] outline-none" placeholder="Spanish message..." @blur="saveHistory()"></textarea>
                </div>
              </div>

              <div v-else-if="inspectorTab === 'options'" class="space-y-4">
                <div v-if="selectedStep.type !== 'menu'" class="rounded-[20px] border border-dashed border-[#dbe3ec] bg-[#f8fbff] px-4 py-6 text-center text-sm text-[#64748b]">
                  Only menu steps have reply options.
                </div>

                <template v-else>
                  <div v-for="option in selectedStep.options" :key="option.id" class="rounded-[20px] border border-[#e7edf3] bg-[#fbfdff] p-4">
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-semibold text-[#102a43]">{{ option.replyValue }}. {{ option.label.en || 'Option' }}</p>
                      <button class="flex h-8 w-8 items-center justify-center rounded-xl border border-[#fee2e2] bg-[#fff1f2] text-[#dc2626] transition hover:bg-[#ffe4e6]" @click="removeOption(option.id)">
                        <UIcon name="i-heroicons-trash-20-solid" style="width:14px;height:14px;" />
                      </button>
                    </div>
                    <div class="mt-3 space-y-3">
                      <input v-model="option.label.en" class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none" placeholder="English option label" @blur="saveHistory()">
                      <input v-model="option.label.es" class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none" placeholder="Spanish option label" @blur="saveHistory()">
                      <div class="grid gap-3 sm:grid-cols-2">
                        <input v-model="option.replyValue" class="rounded-2xl border border-[#dbe3ec] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none" placeholder="Reply" @blur="saveHistory()">
                        <select v-model="option.targetStepId" class="rounded-2xl border border-[#dbe3ec] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none" @change="saveHistory()">
                          <option :value="null">No target</option>
                          <option v-for="target in allStepTargets.filter(item => item.value !== selectedStep.id)" :key="target.value" :value="target.value">{{ target.label }}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="addOption">
                    Add Option
                  </button>
                </template>
              </div>

              <div v-else class="space-y-4">
                <div v-if="selectedStep.type !== 'menu'">
                  <label class="mb-2 block text-sm font-semibold text-[#102a43]">Next Step</label>
                  <select v-model="selectedStep.nextStepId" class="w-full rounded-2xl border border-[#dbe3ec] bg-[#fbfdff] px-4 py-3 text-sm text-[#102a43] outline-none" @change="saveHistory()">
                    <option :value="null">No next step</option>
                    <option v-for="target in allStepTargets.filter(item => item.value !== selectedStep.id)" :key="target.value" :value="target.value">{{ target.label }}</option>
                  </select>
                </div>

                <div v-else class="space-y-3">
                  <div v-for="option in selectedStep.options" :key="option.id" class="rounded-[18px] border border-[#e7edf3] bg-[#fbfdff] px-4 py-3">
                    <p class="text-sm font-semibold text-[#102a43]">{{ option.replyValue }}. {{ option.label.en || 'Option' }}</p>
                    <p class="mt-1 text-xs text-[#64748b]">{{ stepTargetName(option.targetStepId) }}</p>
                  </div>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="duplicateStep">
                  Duplicate
                </button>
                <button class="rounded-2xl border border-[#fee2e2] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#dc2626] transition hover:bg-[#ffe4e6]" @click="deleteStep">
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="workflowCanvasMaximized && previewOpen"
            class="absolute bottom-4 right-4 top-4 z-20 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[30px] border border-[#dbe3ec] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.2)]"
          >
            <div class="flex items-start justify-between gap-4 border-b border-[#edf2f7] bg-[linear-gradient(180deg,#f2fbfa_0%,#f9fcff_100%)] px-5 py-5">
              <div class="flex items-center gap-4">
                <div class="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#14b8a6,#0f766e)] text-white shadow-[0_14px_30px_rgba(20,184,166,0.25)]">
                  <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" style="width:24px;height:24px;" />
                </div>
                <div>
                  <p class="text-[18px] font-bold text-[#102a43]">Workflow Preview</p>
                  <p class="text-sm text-[#64748b]">{{ activeFlow?.name }}</p>
                  <p class="text-sm text-[#64748b]">
                    Testing keyword:
                    <span class="font-semibold text-[#0f766e]">{{ previewTriggerKeyword }}</span>
                  </p>
                </div>
              </div>

              <button class="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe3ec] bg-white text-[#64748b] transition hover:bg-[#f8fbff]" @click="previewOpen = false">
                <UIcon name="i-heroicons-x-mark-20-solid" style="width:18px;height:18px;" />
              </button>
            </div>

            <div class="flex h-[calc(100%-99px)] flex-col bg-[linear-gradient(180deg,#fcfeff_0%,#f8fbff_100%)]">
              <div class="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                <div
                  v-for="message in previewChatMessages"
                  :key="message.id"
                  class="flex"
                  :class="message.role === 'user' ? 'justify-end' : message.role === 'system' ? 'justify-center' : 'justify-start'"
                >
                  <div
                    class="max-w-[84%] rounded-[20px] px-5 py-4 text-[15px] leading-8 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                    :class="message.role === 'bot'
                      ? 'bg-white text-[#1f2937]'
                      : message.role === 'user'
                        ? 'bg-[linear-gradient(135deg,#14b8a6,#0f766e)] text-white'
                        : 'bg-[#eef7ff] text-[#64748b]'"
                  >
                    {{ message.text }}
                  </div>
                </div>
              </div>

              <div v-if="previewCurrentStep?.type === 'menu' && previewCurrentStep.options.length" class="border-t border-[#edf2f7] px-4 pb-3 pt-4">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="option in previewCurrentStep.options"
                    :key="option.id"
                    class="rounded-full border border-[#99f6e4] bg-white px-4 py-2 text-sm font-semibold text-[#0f766e] transition hover:bg-[#effcf9]"
                    @click="sendPreviewReply(option.replyValue)"
                  >
                    {{ option.replyValue }} - {{ optionText(option) || 'Unnamed option' }}
                  </button>
                </div>
              </div>

              <div class="border-t border-[#edf2f7] bg-white px-4 py-4">
                <div class="flex items-center gap-3">
                  <input
                    v-model="previewReply"
                    class="flex-1 rounded-[18px] border-2 border-[#14b8a6] bg-white px-5 py-3 text-base text-[#102a43] outline-none"
                    placeholder="Type a message..."
                    @keydown.enter.prevent="sendPreviewReply()"
                  >
                  <button
                    class="flex h-13 w-13 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#14b8a6,#0f766e)] text-white shadow-[0_14px_30px_rgba(20,184,166,0.25)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="!previewCurrentStep || previewCurrentStep.type !== 'menu'"
                    @click="sendPreviewReply()"
                  >
                    <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" style="width:20px;height:20px;" />
                  </button>
                </div>
                <div class="mt-3 flex items-center justify-between gap-3">
                  <p class="text-sm text-[#64748b]">Simulate user responses to test your workflow</p>
                  <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="previewOpen = false">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="workflow-grid absolute inset-0"></div>

          <div class="absolute left-0 top-0" :style="canvasStyle">
            <svg
              class="pointer-events-none absolute left-0 top-0"
              :width="canvasBounds.width"
              :height="canvasBounds.height"
              :viewBox="`0 0 ${canvasBounds.width} ${canvasBounds.height}`"
            >
              <defs>
                <filter id="flowGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <template v-for="line in connectors" :key="line.id">
                <path :d="line.path" fill="none" stroke="#52c6ba" stroke-width="4" stroke-linecap="round" filter="url(#flowGlow)" />
                <g v-if="line.label">
                  <rect :x="(line.labelX || 0) - 18" :y="(line.labelY || 0) - 11" width="36" height="22" rx="11" fill="white" stroke="#bfdbfe" />
                  <text :x="line.labelX" :y="(line.labelY || 0) + 4" text-anchor="middle" font-size="11" font-weight="700" fill="#2563eb">{{ line.label }}</text>
                </g>
              </template>
            </svg>

            <div
              v-for="step in activeFlow?.steps || []"
              :key="step.id"
              data-step-card
              class="absolute w-[520px] select-none"
              :style="{ left: `${step.x + canvasMetrics.offsetX}px`, top: `${step.y + canvasMetrics.offsetY}px` }"
              @pointerdown.stop="startStepDrag($event, step)"
              @click.stop="selectStep(step.id)"
            >
              <div
                class="rounded-[30px] border bg-white/96 px-6 py-6 backdrop-blur-sm transition-all duration-200"
                :class="[
                  stepTheme(step.type).border,
                  stepTheme(step.type).shadow,
                  activeFlow?.selectedStepId === step.id ? 'ring-2 ring-[#60a5fa] ring-offset-2' : ''
                ]"
              >
                <div class="flex items-start gap-4">
                  <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] text-white shadow-lg" :class="stepTheme(step.type).iconBg">
                    <UIcon :name="stepTheme(step.type).icon" style="width:24px;height:24px;" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <h3 class="text-[18px] font-bold text-[#102a43]">{{ step.title }}</h3>
                        <p class="mt-2 line-clamp-3 text-sm leading-6 text-[#6b7a90]">
                          {{
                            step.type === 'trigger'
                              ? `Listens for incoming keyword: ${step.keyword || 'START'}`
                              : currentText(step) || 'No message configured for this language yet.'
                          }}
                        </p>
                      </div>
                      <span class="rounded-full bg-[#f8fbff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                        {{ stepTypeLabel(step.type) }}
                      </span>
                    </div>

                    <div class="mt-5 flex flex-wrap items-center gap-2">
                      <span v-if="step.type === 'trigger'" class="rounded-full border px-3 py-1 text-xs font-semibold" :class="stepTheme(step.type).pill">
                        {{ step.keyword || 'START' }}
                      </span>
                      <span class="rounded-full border px-3 py-1 text-xs font-semibold" :class="stepTheme(step.type).pill">
                        {{ currentText(step).length }} chars
                      </span>
                      <span v-if="step.content.es" class="rounded-full border border-[#f3e8ff] bg-[#faf5ff] px-3 py-1 text-xs font-semibold text-[#7c3aed]">
                        Spanish ready
                      </span>
                      <span v-if="step.type === 'menu'" class="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                        {{ step.options.length }} options
                      </span>
                    </div>

                    <div v-if="step.type === 'menu'" class="mt-4 flex flex-wrap gap-2">
                      <span
                        v-for="option in step.options.slice(0, 3)"
                        :key="option.id"
                        class="rounded-full border border-[#e7edf3] bg-white px-3 py-1 text-xs font-semibold text-[#486581]"
                      >
                        {{ option.replyValue }}. {{ optionText(option) || 'Unnamed option' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pointer-events-none absolute left-1/2 top-[-11px] h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-[#64748b] bg-white"></div>
              <div class="pointer-events-none absolute left-1/2 bottom-[-11px] h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-[#64748b] bg-white"></div>
            </div>
          </div>
        </div>
        </section>
      </div>

      <aside class="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-[#e7edf3] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div class="border-b border-[#edf2f7] bg-[linear-gradient(120deg,#eefcf9,#f5f5ff)] px-5 py-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-[20px] font-bold text-[#102a43]">Step Configuration</h2>
              <p class="mt-2 text-sm leading-6 text-[#64748b]">Edit the selected step, set both languages, and control routing in one panel.</p>
            </div>
            <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="openPreview(selectedStep?.id)">
              Preview
            </button>
          </div>
          <div v-if="selectedStep" class="mt-4 rounded-[20px] border border-white/80 bg-white/80 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">Selected Step</p>
            <div class="mt-2 flex items-center justify-between gap-3">
              <div>
                <p class="text-base font-semibold text-[#102a43]">{{ selectedStep.title }}</p>
                <p class="text-sm text-[#64748b]">{{ stepTypeLabel(selectedStep.type) }} step</p>
              </div>
              <span class="rounded-full border border-[#e7edf3] bg-[#f8fbff] px-3 py-1 text-sm font-semibold text-[#486581]">
                {{ selectedStep.id }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="selectedStep" class="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div class="inline-flex rounded-full bg-[#f8fbff] p-1">
            <button class="rounded-full px-5 py-2 text-sm font-semibold transition" :class="inspectorTab === 'content' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="inspectorTab = 'content'">Content</button>
            <button class="rounded-full px-5 py-2 text-sm font-semibold transition" :class="inspectorTab === 'options' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="inspectorTab = 'options'">Options</button>
            <button class="rounded-full px-5 py-2 text-sm font-semibold transition" :class="inspectorTab === 'routing' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="inspectorTab = 'routing'">Routing</button>
          </div>

          <div v-if="inspectorTab === 'content'" class="space-y-4">
            <div class="rounded-[20px] border border-[#e7edf3] bg-[#fbfdff] p-4">
              <label class="mb-2 block text-sm font-semibold text-[#102a43]">Step Name</label>
              <input v-model="selectedStep.title" class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3.5 text-base text-[#102a43] outline-none" @blur="saveHistory()">
            </div>

            <div v-if="selectedStep.type === 'trigger'" class="rounded-[20px] border border-[#e7edf3] bg-[#fbfdff] p-4">
              <label class="mb-2 block text-sm font-semibold text-[#102a43]">Keyword</label>
              <input v-model="selectedStep.keyword" class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3.5 text-base uppercase text-[#102a43] outline-none" @blur="saveHistory()">
            </div>

            <div v-if="selectedStep.type !== 'end'" class="rounded-[20px] border border-[#e7edf3] bg-[#fbfdff] p-4">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-[#102a43]">SMS Messages</p>
                  <p class="mt-1 text-sm text-[#64748b]">Write both languages here so the flow is ready for English and Spanish together.</p>
                </div>
              </div>

              <div class="mt-5 space-y-5">
                <div>
                  <div class="mb-2 flex items-center justify-between gap-4">
                    <label class="block text-sm font-semibold text-[#102a43]">English Message</label>
                    <span class="rounded-full border border-[#dbe3ec] bg-white px-3 py-1 text-xs font-semibold text-[#64748b]">{{ selectedStep.content.en.length }}/160</span>
                  </div>
                  <textarea v-model="selectedStep.content.en" rows="5" class="w-full rounded-[22px] border border-[#dbe3ec] bg-white px-4 py-4 text-base leading-7 text-[#102a43] outline-none" placeholder="Enter the English SMS message..." @blur="saveHistory()"></textarea>
                </div>

                <div>
                  <div class="mb-2 flex items-center justify-between gap-4">
                    <label class="block text-sm font-semibold text-[#102a43]">Spanish Message</label>
                    <span class="rounded-full border border-[#dbe3ec] bg-white px-3 py-1 text-xs font-semibold text-[#64748b]">{{ selectedStep.content.es.length }}/160</span>
                  </div>
                  <textarea v-model="selectedStep.content.es" rows="5" class="w-full rounded-[22px] border border-[#dbe3ec] bg-white px-4 py-4 text-base leading-7 text-[#102a43] outline-none" placeholder="Enter the Spanish SMS message..." @blur="saveHistory()"></textarea>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="inspectorTab === 'options'" class="space-y-4">
            <div v-if="selectedStep.type !== 'menu'" class="rounded-[24px] border border-dashed border-[#dbe3ec] bg-[#f8fbff] px-4 py-8 text-center text-sm leading-7 text-[#64748b]">
              Only menu steps can contain response options.
            </div>

            <template v-else>
              <div v-for="option in selectedStep.options" :key="option.id" class="rounded-[20px] border border-[#e7edf3] bg-[#fbfdff] p-4">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-base font-semibold text-[#102a43]">Menu Option</p>
                    <p class="text-sm text-[#64748b]">Set both labels and choose where this reply should go next.</p>
                  </div>
                  <button class="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#fee2e2] bg-[#fff1f2] text-[#dc2626] transition hover:bg-[#ffe4e6]" @click="removeOption(option.id)">
                    <UIcon name="i-heroicons-trash-20-solid" style="width:16px;height:16px;" />
                  </button>
                </div>

                <div class="mt-5 space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-[#102a43]">English Option Label</label>
                    <input v-model="option.label.en" class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3.5 text-base text-[#102a43] outline-none" placeholder="Example: Follow-Up Check-In" @blur="saveHistory()">
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-semibold text-[#102a43]">Spanish Option Label</label>
                    <input v-model="option.label.es" class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3.5 text-base text-[#102a43] outline-none" placeholder="Example: Seguimiento" @blur="saveHistory()">
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label class="mb-2 block text-sm font-semibold text-[#102a43]">Reply Value</label>
                      <input v-model="option.replyValue" class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3.5 text-base text-[#102a43] outline-none" placeholder="1" @blur="saveHistory()">
                    </div>
                    <div>
                      <label class="mb-2 block text-sm font-semibold text-[#102a43]">Target Step</label>
                      <select v-model="option.targetStepId" class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3.5 text-base text-[#102a43] outline-none" @change="saveHistory()">
                        <option :value="null">No target step</option>
                        <option v-for="target in allStepTargets.filter(item => item.value !== selectedStep.id)" :key="target.value" :value="target.value">{{ target.label }}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="addOption">
                Add Option
              </button>
            </template>
          </div>

          <div v-else class="space-y-5">
            <div class="rounded-[20px] border border-[#e7edf3] bg-[#fbfdff] p-4">
              <div v-if="selectedStep.type !== 'menu'">
                <label class="mb-2 block text-sm font-semibold text-[#102a43]">Next Step</label>
                <select v-model="selectedStep.nextStepId" class="w-full rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3.5 text-base text-[#102a43] outline-none" @change="saveHistory()">
                  <option :value="null">No next step</option>
                  <option v-for="target in allStepTargets.filter(item => item.value !== selectedStep.id)" :key="target.value" :value="target.value">{{ target.label }}</option>
                </select>
              </div>

              <div v-else>
                <p class="text-sm font-semibold text-[#102a43]">Menu Routing Overview</p>
                <div class="mt-4 space-y-3">
                  <div v-for="option in selectedStep.options" :key="option.id" class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3">
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-semibold text-[#102a43]">{{ option.replyValue }}. {{ option.label.en || 'Unnamed option' }}</p>
                      <span class="text-xs font-semibold uppercase tracking-[0.12em] text-[#7b8794]">{{ stepTargetName(option.targetStepId) }}</span>
                    </div>
                    <p class="mt-1 text-sm text-[#64748b]">{{ option.label.es || 'No Spanish label yet' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-[20px] border border-[#e7edf3] bg-[#fbfdff] p-4">
              <p class="text-sm font-semibold text-[#102a43]">Builder Tips</p>
              <ul class="mt-3 space-y-2 text-sm leading-7 text-[#64748b]">
                <li>Use message steps for one-way SMS content and menu steps when you need multiple caregiver replies.</li>
                <li>Keep English and Spanish content paired while you build so both versions stay aligned.</li>
                <li>Open preview to test the selected step, click an option, and follow the next response path.</li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="selectedStep" class="border-t border-[#edf2f7] px-5 py-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-3 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="duplicateStep">
              Duplicate Step
            </button>
            <button class="rounded-2xl border border-[#fee2e2] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#dc2626] transition hover:bg-[#ffe4e6]" @click="deleteStep">
              Delete Step
            </button>
          </div>
        </div>
      </aside>
    </div>

    <UModal v-if="!workflowCanvasMaximized" v-model:open="previewOpen" :title="undefined" :ui="{ content: 'sm:max-w-5xl p-0 overflow-hidden' }">
      <template #body>
        <div class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="inline-flex rounded-full bg-[#f8fbff] p-1">
              <button class="rounded-full px-4 py-2 text-sm font-semibold transition" :class="previewMode === 'overview' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="previewMode = 'overview'">Flow Preview</button>
              <button class="rounded-full px-4 py-2 text-sm font-semibold transition" :class="previewMode === 'messages' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="previewMode = 'messages'">Messages</button>
            </div>

            <div class="flex items-center gap-2">
              <div class="inline-flex rounded-full bg-[#f8fbff] p-1">
                <button class="rounded-full px-3 py-1.5 text-sm font-semibold transition" :class="previewLocale === 'en' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="locale = 'en'; startPreviewConversation(previewStepId)">EN</button>
                <button class="rounded-full px-3 py-1.5 text-sm font-semibold transition" :class="previewLocale === 'es' ? 'bg-white text-[#102a43] shadow-sm' : 'text-[#64748b]'" @click="locale = 'es'; startPreviewConversation(previewStepId)">ES</button>
              </div>
              <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="startPreviewConversation(previewStepId)">
                Restart Chat
              </button>
            </div>
          </div>

          <div v-if="previewMode === 'overview'" class="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div class="space-y-3 rounded-[24px] border border-[#e7edf3] bg-[#f8fbff] p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">Preview Steps</p>
                <p class="mt-1 text-lg font-semibold text-[#102a43]">{{ activeFlow?.name }}</p>
              </div>
            </div>

            <button
              v-for="step in orderedSteps"
              :key="step.id"
              class="w-full rounded-[20px] border px-4 py-3 text-left transition"
              :class="previewStepId === step.id ? 'border-[#99f6e4] bg-white shadow-sm' : 'border-[#e7edf3] bg-white/70 hover:bg-white'"
              @click="previewGoToStep(step.id)"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-[#102a43]">{{ step.title }}</p>
                  <p class="mt-1 truncate text-xs text-[#64748b]">{{ stepTypeLabel(step.type) }}</p>
                </div>
                <span class="rounded-full border border-[#e7edf3] bg-[#f8fbff] px-2.5 py-1 text-xs font-semibold text-[#64748b]">{{ previewText(step).length }}</span>
              </div>
            </button>
          </div>

          <div v-if="previewStep" class="space-y-5">
            <div class="rounded-[28px] border border-[#e7edf3] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-[24px] font-bold text-[#102a43]">{{ previewStep.title }}</p>
                  <p class="mt-1 text-sm text-[#64748b]">{{ stepTypeLabel(previewStep.type) }} step</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span v-if="previewStep.type === 'trigger'" class="rounded-full border border-[#99f6e4] bg-[#ecfeff] px-3 py-1 text-sm font-semibold text-[#0f766e]">
                    {{ previewStep.keyword || 'START' }}
                  </span>
                  <span class="rounded-full border border-[#e7edf3] bg-[#f8fbff] px-3 py-1 text-sm font-semibold text-[#486581]">
                    {{ previewText(previewStep).length }} chars
                  </span>
                </div>
              </div>

              <div class="mt-5 rounded-[24px] border border-[#e7edf3] bg-[#f8fbff] p-5">
                <p class="text-sm font-semibold text-[#102a43]">SMS Preview</p>
                <p class="mt-3 whitespace-pre-line text-lg leading-8 text-[#334155]">
                  {{ previewText(previewStep) || 'No message configured yet for this language.' }}
                </p>
              </div>

              <div v-if="previewStep.content.en || previewStep.content.es" class="mt-5 grid gap-4 xl:grid-cols-2">
                <div class="rounded-[22px] border border-[#e7edf3] bg-white p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">English</p>
                  <p class="mt-3 whitespace-pre-line text-sm leading-7 text-[#486581]">{{ previewStep.content.en || 'Not added yet.' }}</p>
                </div>
                <div class="rounded-[22px] border border-[#e7edf3] bg-white p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">Spanish</p>
                  <p class="mt-3 whitespace-pre-line text-sm leading-7 text-[#486581]">{{ previewStep.content.es || 'Not added yet.' }}</p>
                </div>
              </div>

              <div v-if="previewStep.type === 'menu' && previewStep.options.length" class="mt-5 space-y-3">
                <p class="text-sm font-semibold text-[#102a43]">Reply Options</p>
                <button
                  v-for="option in previewStep.options"
                  :key="option.id"
                  class="flex w-full items-center justify-between rounded-[20px] border border-[#dbe3ec] bg-white px-4 py-4 text-left transition hover:bg-[#f8fbff]"
                  @click="previewGoToStep(option.targetStepId)"
                >
                  <div>
                    <p class="text-base font-semibold text-[#102a43]">{{ option.replyValue }}. {{ previewOptionText(option) || 'Unnamed option' }}</p>
                    <p class="mt-1 text-sm text-[#64748b]">{{ option.label.es || 'No Spanish option label yet.' }}</p>
                  </div>
                  <span class="rounded-full border border-[#e7edf3] bg-[#f8fbff] px-3 py-1 text-xs font-semibold text-[#64748b]">
                    {{ stepTargetName(option.targetStepId) }}
                  </span>
                </button>
              </div>

              <div v-else-if="previewStep.nextStepId" class="mt-5">
                <button class="rounded-2xl bg-[linear-gradient(135deg,#0f766e,#14b8a6)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(20,184,166,0.22)] transition hover:brightness-95" @click="previewGoToStep(previewStep.nextStepId)">
                  Continue to {{ stepTargetName(previewStep.nextStepId) }}
                </button>
              </div>
            </div>
          </div>
          </div>

          <div v-else class="mx-auto w-full max-w-[640px] overflow-hidden rounded-[30px] border border-[#dbe3ec] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
            <div class="flex items-start justify-between gap-4 border-b border-[#edf2f7] bg-[linear-gradient(180deg,#f2fbfa_0%,#f9fcff_100%)] px-6 py-5">
              <div class="flex items-center gap-4">
                <div class="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#14b8a6,#0f766e)] text-white shadow-[0_14px_30px_rgba(20,184,166,0.25)]">
                  <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" style="width:24px;height:24px;" />
                </div>
                <div>
                  <p class="text-[18px] font-bold text-[#102a43]">Workflow Preview</p>
                  <p class="text-sm text-[#64748b]">{{ activeFlow?.name }}</p>
                  <p class="text-sm text-[#64748b]">
                    Testing keyword:
                    <span class="font-semibold text-[#0f766e]">{{ previewTriggerKeyword }}</span>
                  </p>
                </div>
              </div>

              <button class="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe3ec] bg-white text-[#64748b] transition hover:bg-[#f8fbff]" @click="previewOpen = false">
                <UIcon name="i-heroicons-x-mark-20-solid" style="width:18px;height:18px;" />
              </button>
            </div>

            <div class="bg-[linear-gradient(180deg,#fcfeff_0%,#f8fbff_100%)] px-5 py-5">
              <div class="flex h-[560px] flex-col">
                <div class="flex-1 space-y-4 overflow-y-auto px-2 py-2">
                  <div
                    v-for="message in previewChatMessages"
                    :key="message.id"
                    class="flex"
                    :class="message.role === 'user' ? 'justify-end' : message.role === 'system' ? 'justify-center' : 'justify-start'"
                  >
                    <div
                      class="max-w-[82%] rounded-[20px] px-5 py-4 text-[15px] leading-8 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                      :class="message.role === 'bot'
                        ? 'bg-white text-[#1f2937]'
                        : message.role === 'user'
                          ? 'bg-[linear-gradient(135deg,#14b8a6,#0f766e)] text-white'
                          : 'bg-[#eef7ff] text-[#64748b]'"
                    >
                      {{ message.text }}
                    </div>
                  </div>
                </div>

                <div v-if="previewCurrentStep?.type === 'menu' && previewCurrentStep.options.length" class="border-t border-[#edf2f7] px-2 pb-3 pt-4">
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="option in previewCurrentStep.options"
                      :key="option.id"
                      class="rounded-full border border-[#99f6e4] bg-white px-4 py-2 text-sm font-semibold text-[#0f766e] transition hover:bg-[#effcf9]"
                      @click="sendPreviewReply(option.replyValue)"
                    >
                      {{ option.replyValue }} - {{ previewOptionText(option) || 'Unnamed option' }}
                    </button>
                  </div>
                </div>

                <div class="border-t border-[#edf2f7] bg-white px-3 py-4">
                  <div class="flex items-center gap-3">
                    <input
                      v-model="previewReply"
                      class="flex-1 rounded-[18px] border-2 border-[#14b8a6] bg-white px-5 py-3 text-base text-[#102a43] outline-none"
                      placeholder="Type a message..."
                      @keydown.enter.prevent="sendPreviewReply()"
                    >
                    <button
                      class="flex h-13 w-13 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#14b8a6,#0f766e)] text-white shadow-[0_14px_30px_rgba(20,184,166,0.25)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="!previewReply.trim()"
                      @click="sendPreviewReply()"
                    >
                      <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" style="width:20px;height:20px;" />
                    </button>
                  </div>
                  <div class="mt-3 flex items-center justify-between gap-3">
                    <p class="text-sm text-[#64748b]">Simulate user responses to test your workflow</p>
                    <button class="rounded-2xl border border-[#dbe3ec] bg-white px-4 py-2 text-sm font-semibold text-[#102a43] transition hover:bg-[#f8fbff]" @click="previewOpen = false">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.workflow-page {
  position: relative;
  z-index: 0;
}

.workflow-viewport {
  position: relative;
  isolation: isolate;
  cursor: grab;
}

.workflow-viewport:active {
  cursor: grabbing;
}

.workflow-grid {
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
  background-size: 44px 44px;
}

.flow-panel-enter-active,
.flow-panel-leave-active {
  transition: all 0.18s ease;
}

.flow-panel-enter-from,
.flow-panel-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
