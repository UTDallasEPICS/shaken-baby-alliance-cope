export type FlowStatus = 'Active' | 'Draft'

export interface Flow {
  id: number
  name: string
  keyword: string
  status: FlowStatus
}

export interface Template {
  id: number
  name: string
  category: string
  preview: string
  usage: string
  lastUpdated: string
}

export interface Caregiver {
  id: number
  name: string
  role: string
  phone: string
  email: string
  patients: string
  status: 'Active' | 'Inactive'
}

export type UserRole = 'Admin' | 'Editor' | 'Viewer'
export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  lastLogin: string
  status: 'Active' | 'Inactive'
}

export type AlertStatus = 'Active' | 'Resolved' | 'Dismissed'
export interface EmergencyAlert {
  id: number
  status: AlertStatus
  patient: string
  patientId: string
  type: string
  time: string
  respondedBy: string
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SEND' | 'LOGIN'
export interface AuditLog {
  id: number
  timestamp: string
  user: string
  action: AuditAction
  resource: string
  resourceId: string
  ip: string
  status: 'Success' | 'Failed'
}

// NOTE: This is an in-memory database for UI prototyping.
// It resets when the dev server restarts.

const flows: Flow[] = [
  { id: 1, name: 'Daily Check-in', keyword: 'CHECKIN', status: 'Active' },
  { id: 2, name: 'Medication Reminder', keyword: 'MED', status: 'Active' },
  { id: 3, name: 'Emergency Alert', keyword: 'HELP', status: 'Active' },
  { id: 4, name: 'Mood Survey', keyword: 'SURVEY', status: 'Draft' },
  { id: 5, name: 'Appointment Reminder', keyword: 'APPT', status: 'Active' },
  { id: 6, name: 'Wellness Check', keyword: 'WELLNESS', status: 'Draft' },
]

const templates: Template[] = [
  {
    id: 1,
    name: 'Welcome Message',
    category: 'Onboarding',
    preview: 'Welcome to COPE! Reply with your name to get started.',
    usage: '145 flows',
    lastUpdated: '2024-03-01',
  },
  {
    id: 2,
    name: 'Daily Check-in',
    category: 'Survey',
    preview: 'How are you feeling today? Reply 1 for Good, 2 for OK, 3 for Not Well.',
    usage: '092 flows',
    lastUpdated: '2024-03-04',
  },
  {
    id: 3,
    name: 'Emergency Alert',
    category: 'Emergency',
    preview: 'URGENT: Emergency detected. Please respond immediately.',
    usage: '025 flows',
    lastUpdated: '2024-02-28',
  },
  {
    id: 4,
    name: 'Medication Reminder',
    category: 'Reminder',
    preview: 'Time to take your medication. Reply DONE when completed.',
    usage: '066 flows',
    lastUpdated: '2024-03-10',
  },
  {
    id: 5,
    name: 'Appointment Confirmation',
    category: 'Reminder',
    preview: 'You have an appointment tomorrow at 3PM. Reply YES to confirm.',
    usage: '254 flows',
    lastUpdated: '2024-03-02',
  },
]

const caregivers: Caregiver[] = [
  { id: 1, name: 'Dr. Sarah Chen', role: 'Primary Care', phone: '+1 (555) 234-5678', email: 'sarah.chen@cope.com', patients: '12 assigned', status: 'Active' },
  { id: 2, name: 'Nurse Linda Martinez', role: 'Home Care', phone: '+1 (555) 345-6789', email: 'linda.martinez@cope.com', patients: '18 assigned', status: 'Active' },
  { id: 3, name: 'Dr. Michael Torres', role: 'Specialist', phone: '+1 (555) 456-7890', email: 'michael.torres@cope.com', patients: '16 assigned', status: 'Active' },
  { id: 4, name: 'Emma Richardson', role: 'Home Care', phone: '+1 (555) 567-8901', email: 'emma.richardson@cope.com', patients: '8 assigned', status: 'Active' },
  { id: 5, name: 'David Park', role: 'Home Care', phone: '+1 (555) 678-9012', email: 'david.park@cope.com', patients: '0 assigned', status: 'Inactive' },
  { id: 6, name: 'Dr. Jennifer Walsh', role: 'Primary Care', phone: '+1 (555) 789-0123', email: 'jennifer.walsh@cope.com', patients: '10 assigned', status: 'Active' },
]

const users: User[] = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah.johnson@cope.com', role: 'Admin', lastLogin: '2024-03-08 10:30 AM', status: 'Active' },
  { id: 2, name: 'Michael Chen', email: 'michael.chen@cope.com', role: 'Admin', lastLogin: '2024-03-06 09:15 AM', status: 'Active' },
  { id: 3, name: 'Emily Davis', email: 'emily.davis@cope.com', role: 'Editor', lastLogin: '2024-03-08 04:45 AM', status: 'Active' },
  { id: 4, name: 'David Martinez', email: 'david.martinez@cope.com', role: 'Editor', lastLogin: '2024-07-08 04:20 PM', status: 'Active' },
  { id: 5, name: 'Jessica Thompson', email: 'jessica.thompson@cope.com', role: 'Viewer', lastLogin: '2024-03-04 02:10 PM', status: 'Active' },
  { id: 6, name: 'Robert Williams', email: 'robert.williams@cope.com', role: 'Viewer', lastLogin: '2024-02-28 11:30 AM', status: 'Inactive' },
]

const alerts: EmergencyAlert[] = [
  { id: 1, status: 'Active', patient: 'Robert Miller', patientId: '#1014', type: 'Fall Detected', time: '2024-03-06 10:45 AM', respondedBy: '---' },
  { id: 2, status: 'Active', patient: 'Margaret Johnson', patientId: '#1016', type: 'Medication Emergency', time: '2024-03-06 09:12 AM', respondedBy: '---' },
  { id: 3, status: 'Resolved', patient: 'James Wilson', patientId: '#1017', type: 'Distress Signal', time: '2024-03-05 08:32 AM', respondedBy: 'Dr. Sarah Chen' },
  { id: 4, status: 'Resolved', patient: 'Patricia Brown', patientId: '#1039', type: 'No Response', time: '2024-03-05 11:20 PM', respondedBy: 'Nurse Linda Martinez' },
  { id: 5, status: 'Dismissed', patient: 'Thomas Anderson', patientId: '#1007', type: 'Chest Pain', time: '2024-03-04 06:46 PM', respondedBy: 'Dr. Michael Torres' },
]

const auditLogs: AuditLog[] = [
  { id: 1, timestamp: '2024-03-06 18:45:32', user: 'sarah.johnson@cope.com', action: 'CREATE', resource: 'Flow', resourceId: 'flow-2847', ip: '192.168.1.45', status: 'Success' },
  { id: 2, timestamp: '2024-03-06 18:32:18', user: 'michael.chen@cope.com', action: 'UPDATE', resource: 'Template', resourceId: 'template-156', ip: '107.168.1.89', status: 'Success' },
  { id: 3, timestamp: '2024-03-06 16:15:09', user: 'emily.davis@cope.com', action: 'DELETE', resource: 'Flow', resourceId: 'flow-2895', ip: '192.168.1.122', status: 'Success' },
  { id: 4, timestamp: '2024-03-06 11:44:44', user: 'david.martinez@cope.com', action: 'UPDATE', resource: 'User', resourceId: 'user-149', ip: '107.168.1.89', status: 'Failed' },
  { id: 5, timestamp: '2024-03-06 09:42:21', user: 'system@cope.com', action: 'SEND', resource: 'Emergency Alert', resourceId: 'alert-786', ip: '127.0.0.1', status: 'Success' },
  { id: 6, timestamp: '2024-03-06 09:33:55', user: 'sarah.johnson@cope.com', action: 'CREATE', resource: 'Caregiver', resourceId: 'caregiver-234', ip: '192.168.1.45', status: 'Success' },
  { id: 7, timestamp: '2024-03-06 08:18:37', user: 'michael.chen@cope.com', action: 'UPDATE', resource: 'Flow', resourceId: 'flow-2842', ip: '107.168.1.89', status: 'Success' },
  { id: 8, timestamp: '2024-03-06 08:05:12', user: 'emily.davis@cope.com', action: 'LOGIN', resource: 'System', resourceId: 'session-408', ip: '192.168.1.122', status: 'Success' },
]

let nextFlowId = 7
let nextTemplateId = 6
let nextCaregiverId = 7
let nextUserId = 7
let nextAlertId = 6
let nextAuditId = 9

function nowTimestamp() {
  // Simple readable timestamp string.
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function pushAudit(partial: Omit<AuditLog, 'id' | 'timestamp'>) {
  auditLogs.unshift({
    id: nextAuditId++,
    timestamp: nowTimestamp(),
    ...partial,
  })
}

// Flows
export function listFlows() {
  return flows
}

export function createFlow(input: Omit<Flow, 'id'>) {
  const created: Flow = { id: nextFlowId++, ...input }
  flows.unshift(created)
  pushAudit({
    user: 'admin@cope.local',
    action: 'CREATE',
    resource: 'Flow',
    resourceId: `flow-${created.id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return created
}

export function updateFlow(id: number, patch: Partial<Omit<Flow, 'id'>>) {
  const flow = flows.find((f) => f.id === id)
  if (!flow) return null
  Object.assign(flow, patch)
  pushAudit({
    user: 'admin@cope.local',
    action: 'UPDATE',
    resource: 'Flow',
    resourceId: `flow-${id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return flow
}

export function deleteFlow(id: number) {
  const idx = flows.findIndex((f) => f.id === id)
  if (idx === -1) return false
  flows.splice(idx, 1)
  pushAudit({
    user: 'admin@cope.local',
    action: 'DELETE',
    resource: 'Flow',
    resourceId: `flow-${id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return true
}

// Templates
export function listTemplates() {
  return templates
}

export function createTemplate(input: Omit<Template, 'id'>) {
  const created: Template = { id: nextTemplateId++, ...input }
  templates.unshift(created)
  pushAudit({
    user: 'admin@cope.local',
    action: 'CREATE',
    resource: 'Template',
    resourceId: `template-${created.id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return created
}

export function updateTemplate(id: number, patch: Partial<Omit<Template, 'id'>>) {
  const template = templates.find((t) => t.id === id)
  if (!template) return null
  Object.assign(template, patch)
  pushAudit({
    user: 'admin@cope.local',
    action: 'UPDATE',
    resource: 'Template',
    resourceId: `template-${id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return template
}

export function deleteTemplate(id: number) {
  const idx = templates.findIndex((t) => t.id === id)
  if (idx === -1) return false
  templates.splice(idx, 1)
  pushAudit({
    user: 'admin@cope.local',
    action: 'DELETE',
    resource: 'Template',
    resourceId: `template-${id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return true
}

// Caregivers
export function listCaregivers() {
  return caregivers
}

export function createCaregiver(input: Omit<Caregiver, 'id'>) {
  const created: Caregiver = { id: nextCaregiverId++, ...input }
  caregivers.unshift(created)
  pushAudit({
    user: 'admin@cope.local',
    action: 'CREATE',
    resource: 'Caregiver',
    resourceId: `caregiver-${created.id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return created
}

export function updateCaregiver(id: number, patch: Partial<Omit<Caregiver, 'id'>>) {
  const caregiver = caregivers.find((c) => c.id === id)
  if (!caregiver) return null
  Object.assign(caregiver, patch)
  pushAudit({
    user: 'admin@cope.local',
    action: 'UPDATE',
    resource: 'Caregiver',
    resourceId: `caregiver-${id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return caregiver
}

export function deleteCaregiver(id: number) {
  const idx = caregivers.findIndex((c) => c.id === id)
  if (idx === -1) return false
  caregivers.splice(idx, 1)
  pushAudit({
    user: 'admin@cope.local',
    action: 'DELETE',
    resource: 'Caregiver',
    resourceId: `caregiver-${id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return true
}

// Users
export function listUsers() {
  return users
}

export function createUser(input: Omit<User, 'id'>) {
  const created: User = { id: nextUserId++, ...input }
  users.unshift(created)
  pushAudit({
    user: 'admin@cope.local',
    action: 'CREATE',
    resource: 'User',
    resourceId: `user-${created.id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return created
}

export function updateUser(id: number, patch: Partial<Omit<User, 'id'>>) {
  const user = users.find((u) => u.id === id)
  if (!user) return null
  Object.assign(user, patch)
  pushAudit({
    user: 'admin@cope.local',
    action: 'UPDATE',
    resource: 'User',
    resourceId: `user-${id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return user
}

export function deleteUser(id: number) {
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return false
  users.splice(idx, 1)
  pushAudit({
    user: 'admin@cope.local',
    action: 'DELETE',
    resource: 'User',
    resourceId: `user-${id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return true
}

// Emergency
export function listEmergencyAlerts() {
  return alerts
}

export function respondEmergencyAlert(id: number, respondedBy: string) {
  const alert = alerts.find((a) => a.id === id)
  if (!alert) return null
  alert.status = 'Resolved'
  alert.respondedBy = respondedBy
  pushAudit({
    user: 'admin@cope.local',
    action: 'UPDATE',
    resource: 'Emergency Alert',
    resourceId: `alert-${id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return alert
}

export function dismissEmergencyAlert(id: number) {
  const alert = alerts.find((a) => a.id === id)
  if (!alert) return null
  alert.status = 'Dismissed'
  alert.respondedBy = '---'
  pushAudit({
    user: 'admin@cope.local',
    action: 'UPDATE',
    resource: 'Emergency Alert',
    resourceId: `alert-${id}`,
    ip: '127.0.0.1',
    status: 'Success',
  })
  return alert
}

// Audit logs
export function listAuditLogs() {
  return auditLogs
}

