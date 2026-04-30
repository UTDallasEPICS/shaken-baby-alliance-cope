import 'dotenv/config'
import { prisma } from '../server/utils/prisma'
import { reindexAllAiKnowledge } from '../server/utils/ai-retrieval'
import { EXTENDED_AI_KNOWLEDGE_ENTRIES } from '../server/utils/ai-knowledge-pack'
import { hashPassword } from 'better-auth/crypto'

type LocaleKey = 'en' | 'es'

type SeedOption = {
  id: string
  labelEn: string
  labelEs: string
  replyValue: string
  targetStepId: string | null
}

type SeedStep = {
  id: string
  type: 'trigger' | 'message' | 'menu' | 'end'
  title: string
  keyword?: string
  contentEn: string
  contentEs: string
  nextStepId?: string | null
  x: number
  y: number
  options?: SeedOption[]
}

type SeedWorkflow = {
  id: string
  name: string
  description: string
  status: 'draft' | 'published'
  publishedAt: Date | null
  selectedStepId: string
  steps: SeedStep[]
}

function localized(en: string, es: string) {
  return { en, es }
}

function daysAgo(days: number, hour = 10, minute = 0) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date
}

function plusMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

const workflows: SeedWorkflow[] = [
  {
    id: 'flow-help',
    name: 'COPE Bilingual Support Flow',
    description: 'Language selection, caregiver support menus, and emergency guidance in English and Spanish.',
    status: 'draft',
    publishedAt: null,
    selectedStepId: 'step-language-selection',
    steps: [
      { id: 'trigger-cope', type: 'trigger', title: 'Welcome Trigger', keyword: 'COPE', contentEn: '', contentEs: '', nextStepId: 'step-language-selection', x: 520, y: 60 },
      { id: 'trigger-help-global', type: 'trigger', title: 'Global Help Keyword', keyword: 'HELP', contentEn: '', contentEs: '', nextStepId: 'step-help-menu', x: 40, y: 60 },
      { id: 'trigger-menu-global', type: 'trigger', title: 'Global Menu Keyword', keyword: 'MENU', contentEn: '', contentEs: '', nextStepId: 'step-main-menu', x: 280, y: 60 },
      { id: 'trigger-emergency-global', type: 'trigger', title: 'Global Emergency Keyword', keyword: 'EMERGENCY', contentEn: '', contentEs: '', nextStepId: 'step-emergency-menu', x: 760, y: 60 },
      { id: 'trigger-stop-global', type: 'trigger', title: 'Global Stop Keyword', keyword: 'STOP', contentEn: '', contentEs: '', nextStepId: 'step-stop-end', x: 1000, y: 60 },
      {
        id: 'step-language-selection',
        type: 'menu',
        title: 'Language Selection',
        contentEn: 'Welcome! We are Shaken Baby Alliance and we are here to help.\nPlease select your language:\n1. English\n2. Spanish\n\nBienvenido! Somos Shaken Baby Alliance y estamos aqui para ayudar.\nPor favor seleccione su idioma:\n1. Ingles\n2. Espanol',
        contentEs: 'Welcome! We are Shaken Baby Alliance and we are here to help.\nPlease select your language:\n1. English\n2. Spanish\n\nBienvenido! Somos Shaken Baby Alliance y estamos aqui para ayudar.\nPor favor seleccione su idioma:\n1. Ingles\n2. Espanol',
        x: 520,
        y: 220,
        options: [
          { id: 'option-language-english', labelEn: 'English', labelEs: 'Ingles', replyValue: '1', targetStepId: 'step-main-menu' },
          { id: 'option-language-spanish', labelEn: 'Spanish', labelEs: 'Espanol', replyValue: '2', targetStepId: 'step-main-menu' },
        ],
      },
      {
        id: 'step-main-menu',
        type: 'menu',
        title: 'Main Menu',
        contentEn: 'How can we help you today?\n1. Help\n2. Emergency',
        contentEs: 'Como podemos ayudarle hoy?\n1. Ayuda\n2. Emergencia',
        x: 520,
        y: 430,
        options: [
          { id: 'option-main-help', labelEn: 'Help', labelEs: 'Ayuda', replyValue: '1', targetStepId: 'step-help-menu' },
          { id: 'option-main-emergency', labelEn: 'Emergency', labelEs: 'Emergencia', replyValue: '2', targetStepId: 'step-emergency-menu' },
        ],
      },
      {
        id: 'step-help-menu',
        type: 'menu',
        title: 'Help Menu',
        contentEn: "I'm here to support you. Choose an option:\n1. I feel overwhelmed\n2. Baby won't stop crying\n3. I feel angry or frustrated\n4. I need parenting tips",
        contentEs: 'Estoy aqui para apoyarle. Elija una opcion:\n1. Me siento abrumado/a\n2. El bebe no deja de llorar\n3. Me siento enojado/a o frustrado/a\n4. Necesito consejos para cuidar al bebe',
        x: 220,
        y: 660,
        options: [
          { id: 'option-help-overwhelmed', labelEn: 'I feel overwhelmed', labelEs: 'Me siento abrumado/a', replyValue: '1', targetStepId: 'step-overwhelmed-1' },
          { id: 'option-help-crying', labelEn: "Baby won't stop crying", labelEs: 'El bebe no deja de llorar', replyValue: '2', targetStepId: 'step-crying-1' },
          { id: 'option-help-angry', labelEn: 'I feel angry or frustrated', labelEs: 'Me siento enojado/a o frustrado/a', replyValue: '3', targetStepId: 'step-angry-1' },
          { id: 'option-help-parenting', labelEn: 'I need parenting tips', labelEs: 'Necesito consejos para cuidar al bebe', replyValue: '4', targetStepId: 'step-parenting-menu' },
        ],
      },
      {
        id: 'step-emergency-menu',
        type: 'menu',
        title: 'Emergency Menu',
        contentEn: 'Call 911 immediately if emergency.\n1. Talk to someone\n2. Calming steps',
        contentEs: 'Llame al 911 inmediatamente si es emergencia.\n1. Hablar con alguien\n2. Pasos para calmarse',
        x: 820,
        y: 660,
        options: [
          { id: 'option-emergency-support', labelEn: 'Talk to someone', labelEs: 'Hablar con alguien', replyValue: '1', targetStepId: 'step-support' },
          { id: 'option-emergency-calming', labelEn: 'Calming steps', labelEs: 'Pasos para calmarse', replyValue: '2', targetStepId: 'step-calming' },
        ],
      },
      { id: 'step-overwhelmed-1', type: 'message', title: 'Overwhelmed Step 1', contentEn: "It's okay to feel overwhelmed. You're doing your best.", contentEs: 'Esta bien sentirse abrumado/a. Esta haciendo lo mejor que puede.', nextStepId: 'step-overwhelmed-2', x: 0, y: 920 },
      { id: 'step-overwhelmed-2', type: 'message', title: 'Overwhelmed Step 2', contentEn: 'Put the baby in a safe place, like a crib, and step away.', contentEs: 'Ponga al bebe en un lugar seguro, como una cuna, y alejese.', nextStepId: 'step-overwhelmed-3', x: 0, y: 1140 },
      { id: 'step-overwhelmed-3', type: 'message', title: 'Overwhelmed Step 3', contentEn: 'Take 10 slow breaths.', contentEs: 'Respire lentamente 10 veces.', nextStepId: 'step-overwhelmed-4', x: 0, y: 1360 },
      {
        id: 'step-overwhelmed-4',
        type: 'menu',
        title: 'Overwhelmed Support Options',
        contentEn: 'Need more help?\n1. Talk to someone\n2. More calming tips',
        contentEs: 'Necesita mas ayuda?\n1. Hablar con alguien\n2. Mas consejos para calmarse',
        x: 0,
        y: 1580,
        options: [
          { id: 'option-overwhelmed-support', labelEn: 'Talk to someone', labelEs: 'Hablar con alguien', replyValue: '1', targetStepId: 'step-support' },
          { id: 'option-overwhelmed-calming', labelEn: 'More calming tips', labelEs: 'Mas consejos para calmarse', replyValue: '2', targetStepId: 'step-calming' },
        ],
      },
      { id: 'step-crying-1', type: 'message', title: 'Crying Step 1', contentEn: 'Babies cry. It is normal.', contentEs: 'Los bebes lloran. Es normal.', nextStepId: 'step-crying-2', x: 260, y: 920 },
      { id: 'step-crying-2', type: 'message', title: 'Crying Step 2', contentEn: 'Check basics:\n- Feeding\n- Diaper\n- Sleep', contentEs: 'Revise lo basico:\n- Alimentacion\n- Panal\n- Sueno', nextStepId: 'step-crying-3', x: 260, y: 1140 },
      { id: 'step-crying-3', type: 'message', title: 'Crying Step 3', contentEn: 'Try soothing:\n- Rock gently\n- Soft sounds\n- Swaddle', contentEs: 'Intente calmar:\n- Mezalo suavemente\n- Sonidos suaves\n- Envuelvalo', nextStepId: 'step-crying-4', x: 260, y: 1360 },
      {
        id: 'step-crying-4',
        type: 'menu',
        title: 'Crying Follow-Up',
        contentEn: 'Still crying?\n1. More tips\n2. Take a safe break',
        contentEs: 'Todavia llora?\n1. Mas consejos\n2. Tome un descanso seguro',
        x: 260,
        y: 1580,
        options: [
          { id: 'option-crying-tips', labelEn: 'More tips', labelEs: 'Mas consejos', replyValue: '1', targetStepId: 'step-more-tips' },
          { id: 'option-crying-break', labelEn: 'Take a safe break', labelEs: 'Tome un descanso seguro', replyValue: '2', targetStepId: 'step-safe-break' },
        ],
      },
      { id: 'step-angry-1', type: 'message', title: 'Angry Step 1', contentEn: 'Feeling angry is normal. Pause.', contentEs: 'Sentirse enojado/a es normal. Haga una pausa.', nextStepId: 'step-angry-2', x: 520, y: 920 },
      { id: 'step-angry-2', type: 'message', title: 'Angry Step 2', contentEn: 'Put the baby in a safe place.', contentEs: 'Ponga al bebe en un lugar seguro.', nextStepId: 'step-angry-3', x: 520, y: 1140 },
      { id: 'step-angry-3', type: 'message', title: 'Angry Step 3', contentEn: 'Step away and breathe slowly.', contentEs: 'Alejese y respire lentamente.', nextStepId: 'step-angry-4', x: 520, y: 1360 },
      {
        id: 'step-angry-4',
        type: 'menu',
        title: 'Angry Support Options',
        contentEn: 'Choose support:\n1. Talk to someone\n2. Calming exercise',
        contentEs: 'Elija apoyo:\n1. Hablar con alguien\n2. Ejercicio para calmarse',
        x: 520,
        y: 1580,
        options: [
          { id: 'option-angry-support', labelEn: 'Talk to someone', labelEs: 'Hablar con alguien', replyValue: '1', targetStepId: 'step-support' },
          { id: 'option-angry-calming', labelEn: 'Calming exercise', labelEs: 'Ejercicio para calmarse', replyValue: '2', targetStepId: 'step-calming' },
        ],
      },
      {
        id: 'step-parenting-menu',
        type: 'menu',
        title: 'Parenting Tips Menu',
        contentEn: 'Choose tips:\n1. Sleep tips\n2. Feeding tips\n3. Soothing tips\n4. Safety tips',
        contentEs: 'Elija consejos:\n1. Dormir\n2. Alimentacion\n3. Calmar\n4. Seguridad',
        x: 760,
        y: 920,
        options: [
          { id: 'option-parenting-sleep', labelEn: 'Sleep tips', labelEs: 'Dormir', replyValue: '1', targetStepId: 'step-sleep-tips' },
          { id: 'option-parenting-feeding', labelEn: 'Feeding tips', labelEs: 'Alimentacion', replyValue: '2', targetStepId: 'step-feeding-tips' },
          { id: 'option-parenting-soothing', labelEn: 'Soothing tips', labelEs: 'Calmar', replyValue: '3', targetStepId: 'step-soothing-tips' },
          { id: 'option-parenting-safety', labelEn: 'Safety tips', labelEs: 'Seguridad', replyValue: '4', targetStepId: 'step-safety-tips' },
        ],
      },
      { id: 'step-support', type: 'message', title: 'Support Step', contentEn: 'Call or text 988 for support.', contentEs: 'Llame o envie mensaje al 988 para apoyo.', nextStepId: null, x: 1040, y: 920 },
      { id: 'step-calming', type: 'message', title: 'Calming Step', contentEn: 'Take a deep breath. Inhale 4 sec, hold, exhale.', contentEs: 'Respire profundo. Inhale 4 seg, mantenga, exhale.', nextStepId: null, x: 1040, y: 1140 },
      { id: 'step-more-tips', type: 'message', title: 'More Tips Step', contentEn: 'Try one method at a time. Ask for help if needed.', contentEs: 'Intente un metodo a la vez. Pida ayuda si es necesario.', nextStepId: null, x: 260, y: 1800 },
      { id: 'step-safe-break', type: 'message', title: 'Safe Break Step', contentEn: 'Place baby safely and take a short break.', contentEs: 'Coloque al bebe seguro y tome un descanso.', nextStepId: null, x: 460, y: 1800 },
      { id: 'step-sleep-tips', type: 'message', title: 'Sleep Tips Step', contentEn: 'Keep routine, dim lights, calm environment.', contentEs: 'Mantenga rutina, luz baja, ambiente tranquilo.', nextStepId: null, x: 760, y: 1140 },
      { id: 'step-feeding-tips', type: 'message', title: 'Feeding Tips Step', contentEn: 'Feed regularly and burp gently.', contentEs: 'Alimente regularmente y saque gases.', nextStepId: null, x: 920, y: 1140 },
      { id: 'step-soothing-tips', type: 'message', title: 'Soothing Tips Step', contentEn: 'Hold gently and reduce noise.', contentEs: 'Sostenga suavemente y reduzca ruido.', nextStepId: null, x: 1080, y: 1140 },
      { id: 'step-safety-tips', type: 'message', title: 'Safety Tips Step', contentEn: 'Never shake the baby. Always safe sleep.', contentEs: 'Nunca sacuda al bebe. Sueno seguro siempre.', nextStepId: null, x: 1240, y: 1140 },
      { id: 'step-stop-end', type: 'end', title: 'Conversation Ended', contentEn: 'You have been unsubscribed from COPE messages. Reply COPE whenever you need support again.', contentEs: 'Ha salido de los mensajes de COPE. Responda COPE cuando necesite apoyo otra vez.', x: 1240, y: 420 },
    ],
  },
  {
    id: 'flow-welcome',
    name: 'New Caregiver Welcome',
    description: 'Short welcome flow for newly enrolled caregivers.',
    status: 'published',
    publishedAt: daysAgo(7),
    selectedStepId: 'welcome-intro',
    steps: [
      { id: 'welcome-trigger', type: 'trigger', title: 'Welcome Keyword Trigger', keyword: 'START', contentEn: '', contentEs: '', nextStepId: 'welcome-intro', x: 160, y: 80 },
      { id: 'welcome-intro', type: 'message', title: 'Welcome Intro', contentEn: 'Welcome back to COPE. We are glad you are here.', contentEs: 'Bienvenido de nuevo a COPE. Nos alegra que este aqui.', nextStepId: 'welcome-options', x: 160, y: 260 },
      {
        id: 'welcome-options',
        type: 'menu',
        title: 'Welcome Options',
        contentEn: 'What would you like next?\n1. Main Menu\n2. Parenting Tips',
        contentEs: 'Que le gustaria despues?\n1. Menu Principal\n2. Consejos para padres',
        x: 160,
        y: 460,
        options: [
          { id: 'welcome-option-menu', labelEn: 'Main Menu', labelEs: 'Menu Principal', replyValue: '1', targetStepId: 'welcome-main-menu-link' },
          { id: 'welcome-option-tips', labelEn: 'Parenting Tips', labelEs: 'Consejos para padres', replyValue: '2', targetStepId: 'welcome-tip' },
        ],
      },
      { id: 'welcome-main-menu-link', type: 'message', title: 'Main Menu Link', contentEn: 'Reply MENU anytime to reopen your support options.', contentEs: 'Responda MENU en cualquier momento para abrir sus opciones de apoyo.', nextStepId: null, x: 60, y: 680 },
      { id: 'welcome-tip', type: 'message', title: 'Starter Tip', contentEn: 'If you feel stressed, put the baby in a safe place and take a short pause.', contentEs: 'Si se siente estresado, ponga al bebe en un lugar seguro y tome una pausa corta.', nextStepId: null, x: 280, y: 680 },
    ],
  },
]

const mainWorkflow = workflows[0]
const stepLookup = new Map(mainWorkflow.steps.map((step) => [step.id, step]))

function stepText(stepId: string, locale: LocaleKey) {
  const step = stepLookup.get(stepId)
  if (!step) return ''
  return locale === 'es'
    ? step.contentEs || step.contentEn
    : step.contentEn || step.contentEs
}

async function main() {
  console.log('Resetting and seeding database...')

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@gmail.com'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin@123'
  const passwordHash = await hashPassword(adminPassword)

  await prisma.$transaction([
    prisma.aiResponseLog.deleteMany(),
    prisma.aiKnowledgeChunk.deleteMany(),
    prisma.aiKnowledgeEntry.deleteMany(),
    prisma.messageLog.deleteMany(),
    prisma.message.deleteMany(),
    prisma.caregiverNote.deleteMany(),
    prisma.caregiverKeyword.deleteMany(),
    prisma.messageWorkflowOption.deleteMany(),
    prisma.messageWorkflowStep.deleteMany(),
    prisma.workflow.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.caregiver.deleteMany(),
    prisma.user.deleteMany(),
  ])

  const users = [
    { id: 'user_admin_1', name: 'Admin', email: adminEmail, role: 'admin', username: 'admin', displayUsername: 'Admin' },
  ]

  await prisma.user.createMany({
    data: users.map((user) => ({
      ...user,
      emailVerified: true,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(1),
    })),
  })

  await prisma.account.createMany({
    data: users.map((user, index) => ({
      id: `acct_${index + 1}`,
      accountId: user.email,
      providerId: 'credential',
      userId: user.id,
      password: passwordHash,
      createdAt: daysAgo(20 - index),
      updatedAt: daysAgo(2),
    })),
  })

  await prisma.session.createMany({
    data: users.map((user, index) => ({
      id: `sess_${index + 1}`,
      token: `session-token-${index + 1}`,
      expiresAt: plusMinutes(new Date(), 60 * 24 * 7),
      ipAddress: `192.168.10.${index + 10}`,
      userAgent: 'Mozilla/5.0',
      userId: user.id,
      createdAt: daysAgo(index + 1),
      updatedAt: daysAgo(index + 1),
    })),
  })

  await prisma.verification.createMany({
    data: users.map((user, index) => ({
      id: `ver_${index + 1}`,
      identifier: user.email,
      value: `verify-${index + 1}`,
      expiresAt: plusMinutes(new Date(), 60 * 24 * 3),
      createdAt: daysAgo(index + 1),
      updatedAt: daysAgo(index + 1),
    })),
  })

  const firstNames = ['Ava', 'Liam', 'Sophia', 'Noah', 'Isabella', 'Mason', 'Mia', 'Ethan', 'Charlotte', 'James', 'Amelia', 'Benjamin', 'Harper', 'Lucas', 'Evelyn', 'Henry', 'Abigail', 'Alexander', 'Ella', 'Michael', 'Scarlett', 'Daniel', 'Emily', 'Matthew', 'Aria', 'Samuel', 'Luna', 'David', 'Camila', 'Joseph']
  const lastNames = ['Johnson', 'Martinez', 'Nguyen', 'Garcia', 'Williams', 'Brown', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Lee', 'Clark', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker']
  const cities = ['Dallas', 'Fort Worth', 'Austin', 'Houston', 'San Antonio', 'Plano', 'Irving', 'Waco', 'McKinney', 'Garland']
  const streets = ['Oak Street', 'Willow Lane', 'Maple Drive', 'Pecan Ridge', 'Cedar Court', 'Pine Avenue']

  const caregivers = Array.from({ length: 120 }, (_, index) => {
    const locale: LocaleKey = index % 3 === 0 ? 'es' : 'en'
    const firstName = firstNames[index % firstNames.length]
    const lastName = lastNames[index % lastNames.length]
    const fullName = `${firstName} ${lastName}`
    const createdAt = daysAgo(90 - (index % 60), 9 + (index % 6), 10)
    const status = index % 17 === 0 ? 'INACTIVE' : 'ACTIVE'
    const currentStepId = index % 5 === 0
      ? 'step-main-menu'
      : index % 5 === 1
        ? 'step-help-menu'
        : index % 5 === 2
          ? 'step-overwhelmed-4'
          : null

    return {
      id: `cg_${String(index + 1).padStart(3, '0')}`,
      name: fullName,
      phone: `+1214555${String(index + 1).padStart(4, '0')}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@example.com`,
      address: `${100 + index} ${streets[index % streets.length]}`,
      city: cities[index % cities.length],
      state: 'TX',
      zip: `${75000 + index}`,
      preferredLanguage: locale === 'es' ? 'SPANISH' : 'ENGLISH',
      status,
      currentWorkflowId: currentStepId ? 'flow-help' : null,
      currentStepId,
      firstContactDate: createdAt,
      lastInteraction: plusMinutes(createdAt, 60 * ((index % 10) + 1)),
      createdAt,
      updatedAt: plusMinutes(createdAt, 60 * 4),
    }
  })

  await prisma.caregiver.createMany({ data: caregivers })

  const caregiverKeywords = caregivers.flatMap((caregiver, index) => {
    const base = ['COPE', 'MENU']
    const extra = index % 4 === 0
      ? ['HELP']
      : index % 4 === 1
        ? ['EMERGENCY']
        : index % 4 === 2
          ? ['STOP']
          : ['START']

    return [...base, ...extra].map((keyword, kwIndex) => ({
      id: `cg_kw_${index + 1}_${kwIndex + 1}`,
      caregiverId: caregiver.id,
      keyword,
      createdAt: caregiver.createdAt,
    }))
  })

  await prisma.caregiverKeyword.createMany({ data: caregiverKeywords })

  const caregiverNotes = caregivers
    .filter((_, index) => index % 6 === 0)
    .map((caregiver, index) => ({
      id: `note_${index + 1}`,
      caregiverId: caregiver.id,
      body: index % 2 === 0
        ? 'Caregiver requested follow-up resources and prefers afternoon outreach.'
        : 'Staff documented calmer mood after breathing exercise workflow.',
      authorName: users[index % users.length].name,
      createdAt: plusMinutes(caregiver.createdAt, 120),
      updatedAt: plusMinutes(caregiver.createdAt, 120),
    }))

  await prisma.caregiverNote.createMany({ data: caregiverNotes })

  await prisma.workflow.createMany({
    data: workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      isActive: true,
      publishedAt: workflow.publishedAt,
      selectedStepId: workflow.selectedStepId,
      createdAt: daysAgo(15),
      updatedAt: daysAgo(1),
    })),
  })

  await prisma.messageWorkflowStep.createMany({
    data: workflows.flatMap((workflow) =>
      workflow.steps.map((step, index) => ({
        id: step.id,
        workflowId: workflow.id,
        type: step.type,
        title: step.title,
        keyword: step.keyword || null,
        contentEn: step.contentEn,
        contentEs: step.contentEs,
        nextStepId: step.nextStepId || null,
        positionX: step.x,
        positionY: step.y,
        sortOrder: index,
        createdAt: daysAgo(15),
        updatedAt: daysAgo(1),
      }))
    ),
  })

  await prisma.messageWorkflowOption.createMany({
    data: workflows.flatMap((workflow) =>
      workflow.steps.flatMap((step) =>
        (step.options || []).map((option, index) => ({
          id: option.id,
          stepId: step.id,
          labelEn: option.labelEn,
          labelEs: option.labelEs,
          replyValue: option.replyValue,
          targetStepId: option.targetStepId,
          sortOrder: index,
          createdAt: daysAgo(15),
          updatedAt: daysAgo(1),
        }))
      )
    ),
  })

  const aiKnowledgeEntries = [
    {
      id: 'ai_knowledge_never_shake',
      title: 'Never shake a baby',
      category: 'Safety',
      content: 'Shaking causes abusive head trauma (AHT). Even brief shaking can cause permanent brain damage or death. If overwhelmed, put the baby down in a safe place such as a crib and step away.',
      active: true,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_safe_sleep',
      title: 'Safe sleep rules',
      category: 'Safety',
      content: 'Always place baby on their back on a firm, flat sleep surface. Keep pillows, blankets, bumpers, toys, and loose items out of the sleep area. Baby should sleep alone in their own crib or bassinet.',
      active: true,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_crying_steps',
      title: "Baby won't stop crying steps",
      category: 'Crying',
      content: 'Check feeding, diaper, temperature, and sleep. Try gentle rocking, soft sounds, burping, or swaddling if safe. If the caregiver feels overwhelmed, they should place the baby safely in a crib and take a short break.',
      active: true,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_overwhelmed',
      title: 'Overwhelmed caregiver steps',
      category: 'Parenting',
      content: 'It is okay to feel overwhelmed. Put the baby in a safe place like a crib, step into another room, and take 10 slow breaths. Call or text 988 for support if the caregiver needs someone to talk to.',
      active: true,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_emergency_contacts',
      title: 'Emergency contacts',
      category: 'Emergency',
      content: 'Call 911 immediately if the baby or caregiver is in immediate danger. Call or text 988 for mental health crisis support. Help is available 24/7.',
      active: true,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_sba_program',
      title: 'About Shaken Baby Alliance COPE',
      category: 'Organization',
      content: 'The Shaken Baby Alliance COPE program provides bilingual SMS-based support to caregivers. The program offers parenting guidance, emotional support, safety reminders, and crisis resources in English and Spanish.',
      active: true,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_feeding_tips',
      title: 'Feeding tips for newborns',
      category: 'Parenting',
      content: 'Newborns often feed every 2 to 3 hours or on demand. Burp gently after feeding. If feeding is difficult or the caregiver is worried about the baby, they should contact a medical professional.',
      active: false,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_angry_caregiver',
      title: 'Angry caregiver immediate steps',
      category: 'Emergency',
      content: 'If a caregiver feels angry or afraid they might hurt the baby, they should put the baby in a crib or other safe place right now and walk to another room. Do not pick up the baby until calmer. Call or text 988, or call 911 if there is immediate danger.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_safe_break',
      title: 'Safe break when caregiver is stressed',
      category: 'Safety',
      content: 'A safe break means placing the baby on their back in a crib or bassinet, making sure the baby is safe, and stepping away for a few minutes. The caregiver can breathe slowly, get water, call someone trusted, or call/text 988 if they need support.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_soothing_methods',
      title: 'Soothing methods for crying',
      category: 'Crying',
      content: 'Try one soothing method at a time: gentle rocking, soft shushing, dim lights, a pacifier if used, burping, a clean diaper, or a quiet room. If nothing works and the caregiver feels stressed, place the baby safely down and take a short break.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_crying_normal',
      title: 'Crying can be normal',
      category: 'Crying',
      content: 'Babies cry to communicate needs such as hunger, discomfort, tiredness, gas, or overstimulation. Crying can feel intense, but it does not mean the caregiver is failing. Never shake a baby; use a safe break if overwhelmed.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_call_911',
      title: 'When to call 911',
      category: 'Emergency',
      content: 'Call 911 immediately if the baby is injured, unresponsive, not breathing normally, having a seizure, in immediate danger, or if someone might hurt the baby. The AI should not delay emergency help.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_call_988',
      title: 'When to call or text 988',
      category: 'Emergency',
      content: 'Call or text 988 when the caregiver feels overwhelmed, in crisis, afraid they might hurt themselves or someone else, or needs immediate emotional support. 988 is available 24/7 in the United States.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_medical_boundary',
      title: 'Medical advice boundary',
      category: 'Safety',
      content: 'The AI must not diagnose medical conditions or replace a medical professional. If a caregiver is worried about illness, injury, breathing, fever, feeding, dehydration, or unusual behavior, advise contacting a doctor, nurse line, urgent care, or 911 for emergencies.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_spanish_overwhelmed',
      title: 'Spanish overwhelmed caregiver response',
      category: 'Parenting',
      content: 'Si se siente abrumado/a, ponga al bebe en un lugar seguro como una cuna, alejese unos minutos y respire lento 10 veces. Si necesita apoyo ahora, llame o envie un mensaje al 988. Si hay peligro inmediato, llame al 911.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_spanish_crying',
      title: 'Spanish crying baby response',
      category: 'Crying',
      content: 'Si el bebe no deja de llorar, revise si tiene hambre, panal sucio, gases, calor, frio o sueno. Intente calmarlo suavemente con sonidos tranquilos o meciendolo con cuidado. Si se siente frustrado/a, ponga al bebe seguro en la cuna y tome un descanso corto.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_spanish_never_shake',
      title: 'Spanish never shake a baby',
      category: 'Safety',
      content: 'Nunca sacuda a un bebe. Sacudir puede causar dano cerebral permanente o la muerte. Si se siente fuera de control, ponga al bebe en un lugar seguro, alejese y llame o envie un mensaje al 988; llame al 911 si hay peligro inmediato.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_sleep_short',
      title: 'Short safe sleep answer',
      category: 'Safety',
      content: 'Safe sleep means baby sleeps alone, on their back, on a firm flat surface, with no pillows, blankets, toys, bumpers, or loose items in the sleep space.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_formula_breastfeeding',
      title: 'Feeding support boundary',
      category: 'Parenting',
      content: 'For feeding questions, keep guidance basic and supportive: feed on demand or as advised by a clinician, burp gently, and watch wet diapers and behavior. If the baby is not feeding, seems dehydrated, is very sleepy, or the caregiver is worried, contact a medical professional.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'ai_knowledge_follow_up_staff',
      title: 'When staff follow-up is needed',
      category: 'Organization',
      content: 'If the caregiver asks for direct program help, case support, resources, or follow-up, the system should keep the reply brief and encourage using the available menu or staff contact process. The AI should not promise that staff will call unless that workflow exists.',
      active: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
  ]

  const allAiKnowledgeEntries = [
    ...aiKnowledgeEntries,
    ...EXTENDED_AI_KNOWLEDGE_ENTRIES.map((entry) => ({
      ...entry,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    })),
  ]

  await prisma.aiKnowledgeEntry.createMany({ data: allAiKnowledgeEntries })
  await reindexAllAiKnowledge()

  const messages: Array<Record<string, any>> = []
  const messageLogs: Array<Record<string, any>> = []
  let messageCounter = 1
  let logCounter = 1

  const addMessage = (input: {
    caregiverId?: string | null
    phone: string
    contactName: string
    text: string
    direction: 'INBOUND' | 'OUTBOUND'
    keyword?: string | null
    language?: string | null
    workflowId?: string | null
    workflowStepId?: string | null
    createdAt: Date
    status?: string
  }) => {
    const id = `msg_${String(messageCounter++).padStart(5, '0')}`
    const providerMessageId = `${input.direction.toLowerCase()}-${id}`

    messages.push({
      id,
      caregiverId: input.caregiverId || null,
      phone: input.phone,
      contactName: input.contactName,
      messageText: input.text,
      normalizedText: input.text.trim().toUpperCase(),
      direction: input.direction,
      keywordDetected: input.keyword || null,
      language: input.language || null,
      workflowId: input.workflowId || null,
      workflowStepId: input.workflowStepId || null,
      providerName: 'Seed Simulator',
      providerMessageId,
      sentAt: input.direction === 'OUTBOUND' ? input.createdAt : null,
      receivedAt: input.direction === 'INBOUND' ? input.createdAt : null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    })

    messageLogs.push({
      id: `ml_${String(logCounter++).padStart(5, '0')}`,
      messageId: id,
      caregiverId: input.caregiverId || null,
      phone: input.phone,
      contactName: input.contactName,
      eventType: input.direction === 'INBOUND' ? 'MESSAGE_RECEIVED' : 'MESSAGE_SENT',
      status: input.status || (input.direction === 'INBOUND' ? 'RECEIVED' : 'DELIVERED'),
      direction: input.direction,
      providerName: 'Seed Simulator',
      providerMessageId,
      providerResponse: input.direction === 'OUTBOUND' ? '{"provider":"seed","status":"queued"}' : null,
      errorMessage: input.status === 'FAILED' ? 'Carrier timeout during delivery.' : null,
      details: input.workflowStepId ? `workflow:${input.workflowId};step:${input.workflowStepId}` : null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    })
  }

  const branchSequences = [
    { menuReply: '1', stepIds: ['step-overwhelmed-1', 'step-overwhelmed-2', 'step-overwhelmed-3', 'step-overwhelmed-4'] },
    { menuReply: '2', stepIds: ['step-crying-1', 'step-crying-2', 'step-crying-3', 'step-crying-4'] },
    { menuReply: '3', stepIds: ['step-angry-1', 'step-angry-2', 'step-angry-3', 'step-angry-4'] },
    { menuReply: '4', stepIds: ['step-parenting-menu'] },
  ]

  caregivers.forEach((caregiver, index) => {
    const locale: LocaleKey = caregiver.preferredLanguage === 'SPANISH' ? 'es' : 'en'
    const languageReply = locale === 'es' ? '2' : '1'
    const startAt = daysAgo(40 - (index % 30), 8 + (index % 4), index % 50)
    const branch = branchSequences[index % branchSequences.length]
    const contactName = caregiver.name || 'Unknown Caregiver'

    addMessage({
      caregiverId: caregiver.id,
      phone: caregiver.phone,
      contactName,
      text: 'COPE',
      direction: 'INBOUND',
      keyword: 'COPE',
      createdAt: startAt,
      workflowId: 'flow-help',
      workflowStepId: 'trigger-cope',
    })
    addMessage({
      caregiverId: caregiver.id,
      phone: caregiver.phone,
      contactName,
      text: stepText('step-language-selection', locale),
      direction: 'OUTBOUND',
      keyword: 'COPE',
      language: locale === 'es' ? 'SPANISH' : 'ENGLISH',
      workflowId: 'flow-help',
      workflowStepId: 'step-language-selection',
      createdAt: plusMinutes(startAt, 1),
    })
    addMessage({
      caregiverId: caregiver.id,
      phone: caregiver.phone,
      contactName,
      text: languageReply,
      direction: 'INBOUND',
      keyword: languageReply,
      language: locale === 'es' ? 'SPANISH' : 'ENGLISH',
      workflowId: 'flow-help',
      workflowStepId: 'step-language-selection',
      createdAt: plusMinutes(startAt, 2),
    })
    addMessage({
      caregiverId: caregiver.id,
      phone: caregiver.phone,
      contactName,
      text: stepText('step-main-menu', locale),
      direction: 'OUTBOUND',
      language: locale === 'es' ? 'SPANISH' : 'ENGLISH',
      workflowId: 'flow-help',
      workflowStepId: 'step-main-menu',
      createdAt: plusMinutes(startAt, 3),
    })

    if (index % 6 === 5) {
      addMessage({
        caregiverId: caregiver.id,
        phone: caregiver.phone,
        contactName,
        text: 'EMERGENCY',
        direction: 'INBOUND',
        keyword: 'EMERGENCY',
        language: locale === 'es' ? 'SPANISH' : 'ENGLISH',
        workflowId: 'flow-help',
        workflowStepId: 'trigger-emergency-global',
        createdAt: plusMinutes(startAt, 4),
      })
      addMessage({
        caregiverId: caregiver.id,
        phone: caregiver.phone,
        contactName,
        text: stepText('step-emergency-menu', locale),
        direction: 'OUTBOUND',
        language: locale === 'es' ? 'SPANISH' : 'ENGLISH',
        workflowId: 'flow-help',
        workflowStepId: 'step-emergency-menu',
        createdAt: plusMinutes(startAt, 5),
      })
      addMessage({
        caregiverId: caregiver.id,
        phone: caregiver.phone,
        contactName,
        text: index % 2 === 0 ? '1' : '2',
        direction: 'INBOUND',
        keyword: index % 2 === 0 ? '1' : '2',
        language: locale === 'es' ? 'SPANISH' : 'ENGLISH',
        workflowId: 'flow-help',
        workflowStepId: 'step-emergency-menu',
        createdAt: plusMinutes(startAt, 6),
      })
      addMessage({
        caregiverId: caregiver.id,
        phone: caregiver.phone,
        contactName,
        text: stepText(index % 2 === 0 ? 'step-support' : 'step-calming', locale),
        direction: 'OUTBOUND',
        language: locale === 'es' ? 'SPANISH' : 'ENGLISH',
        workflowId: 'flow-help',
        workflowStepId: index % 2 === 0 ? 'step-support' : 'step-calming',
        createdAt: plusMinutes(startAt, 7),
        status: index % 12 === 5 ? 'FAILED' : 'DELIVERED',
      })
      return
    }

    addMessage({
      caregiverId: caregiver.id,
      phone: caregiver.phone,
      contactName,
      text: '1',
      direction: 'INBOUND',
      keyword: '1',
      language: locale === 'es' ? 'SPANISH' : 'ENGLISH',
      workflowId: 'flow-help',
      workflowStepId: 'step-main-menu',
      createdAt: plusMinutes(startAt, 4),
    })
    addMessage({
      caregiverId: caregiver.id,
      phone: caregiver.phone,
      contactName,
      text: stepText('step-help-menu', locale),
      direction: 'OUTBOUND',
      language: locale === 'es' ? 'SPANISH' : 'ENGLISH',
      workflowId: 'flow-help',
      workflowStepId: 'step-help-menu',
      createdAt: plusMinutes(startAt, 5),
    })
    addMessage({
      caregiverId: caregiver.id,
      phone: caregiver.phone,
      contactName,
      text: branch.menuReply,
      direction: 'INBOUND',
      keyword: branch.menuReply,
      language: locale === 'es' ? 'SPANISH' : 'ENGLISH',
      workflowId: 'flow-help',
      workflowStepId: 'step-help-menu',
      createdAt: plusMinutes(startAt, 6),
    })

    branch.stepIds.forEach((stepId, offset) => {
      addMessage({
        caregiverId: caregiver.id,
        phone: caregiver.phone,
        contactName,
        text: stepText(stepId, locale),
        direction: 'OUTBOUND',
        language: locale === 'es' ? 'SPANISH' : 'ENGLISH',
        workflowId: 'flow-help',
        workflowStepId: stepId,
        createdAt: plusMinutes(startAt, 7 + offset),
        status: index % 14 === 0 && offset === branch.stepIds.length - 1 ? 'FAILED' : 'DELIVERED',
      })
    })
  })

  Array.from({ length: 12 }, (_, index) => {
    const phone = `+1319555${String(index + 1).padStart(4, '0')}`
    const createdAt = daysAgo(10 - index, 14, index * 3)
    addMessage({
      phone,
      contactName: 'Unknown Sender',
      text: index % 2 === 0 ? 'hello' : 'ayuda',
      direction: 'INBOUND',
      keyword: null,
      createdAt,
    })
    addMessage({
      phone,
      contactName: 'Unknown Sender',
      text: stepText('step-language-selection', 'en'),
      direction: 'OUTBOUND',
      language: 'ENGLISH',
      workflowId: 'flow-help',
      workflowStepId: 'step-language-selection',
      createdAt: plusMinutes(createdAt, 1),
      status: 'DELIVERED',
    })
  })

  await prisma.message.createMany({ data: messages })
  await prisma.messageLog.createMany({ data: messageLogs })

  console.log('Seed complete')
  console.log(`Users: ${users.length}`)
  console.log(`Caregivers: ${caregivers.length}`)
  console.log(`Caregiver Keywords: ${caregiverKeywords.length}`)
  console.log(`Caregiver Notes: ${caregiverNotes.length}`)
  console.log(`Workflows: ${workflows.length}`)
  console.log(`Workflow Steps: ${workflows.reduce((count, workflow) => count + workflow.steps.length, 0)}`)
  console.log(`Workflow Options: ${workflows.reduce((count, workflow) => count + workflow.steps.reduce((sum, step) => sum + (step.options?.length || 0), 0), 0)}`)
  console.log(`AI Knowledge Entries: ${allAiKnowledgeEntries.length}`)
  console.log(`Messages: ${messages.length}`)
  console.log(`Message Logs: ${messageLogs.length}`)
  console.log(`Admin login: ${adminEmail} / (from ADMIN_PASSWORD env var)`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
