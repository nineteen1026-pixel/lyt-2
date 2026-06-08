export type ElderlyStatus = 'normal' | 'warning' | 'alert'

export interface Elderly {
  id: string
  name: string
  age: number
  gender: string
  status: ElderlyStatus
  avatar: string
}

export type HealthMetricType = 'bloodPressure' | 'heartRate' | 'bloodSugar' | 'temperature'

export interface HealthRecord {
  id: string
  elderlyId: string
  type: HealthMetricType
  value: number
  systolic?: number
  diastolic?: number
  unit: string
  date: string
  time: string
}

export type MedicationStatus = 'taken' | 'pending' | 'missed'

export interface Medication {
  id: string
  elderlyId: string
  name: string
  dosage: string
  frequency: string
  scheduledTime: string
  status: MedicationStatus
  date: string
  notes: string
}

export type AlertLevel = 'urgent' | 'warning' | 'info'

export interface Alert {
  id: string
  elderlyId: string
  level: AlertLevel
  title: string
  description: string
  time: string
  resolved: boolean
}

export interface Contact {
  id: string
  elderlyId: string
  name: string
  relationship: string
  phone: string
  isEmergency: boolean
  avatar: string
}

export type ServiceType =
  | 'home_care'
  | 'medical_assist'
  | 'housekeeping'
  | 'accompany'
  | 'psychological'
  | 'emergency'

export type AppointmentStatus =
  | 'pending'
  | 'family_pending'
  | 'family_confirmed'
  | 'completed'
  | 'rejected'
  | 'family_rejected'
  | 'cancelled'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface RiskFactor {
  key: string
  label: string
  score: number
  maxScore: number
  level: RiskLevel
  description: string
  icon: string
}

export interface FamilyNotificationStrategy {
  riskLevel: RiskLevel
  label: string
  description: string
  channels: string[]
  frequency: string
  triggerEvents: string[]
  emergencyAction: string
}

export interface RiskAssessment {
  elderlyId: string
  overallRisk: RiskLevel
  totalScore: number
  maxTotalScore: number
  factors: RiskFactor[]
  notificationStrategy: FamilyNotificationStrategy
  assessedAt: string
}

export interface Appointment {
  id: string
  elderlyId: string
  serviceType: ServiceType
  title: string
  description: string
  appointmentDate: string
  appointmentTime: string
  address: string
  status: AppointmentStatus
  applicantName: string
  applicantPhone: string
  familyContactId: string
  familyConfirmed: boolean
  familyConfirmTime?: string
  rejectReason?: string
  createdAt: string
  notes: string
}

export type CareTaskCategory =
  | 'daily_care'
  | 'medical'
  | 'housework'
  | 'accompany'
  | 'emotional'
  | 'finance'

export type CareTaskPriority = 'high' | 'medium' | 'low'

export type CareTaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'

export type TodoSyncSource = 'medication' | 'appointment' | 'alert' | 'manual'

export type TodoSyncStatus = 'pending' | 'done' | 'synced'

export interface CareTask {
  id: string
  elderlyId: string
  title: string
  description: string
  category: CareTaskCategory
  priority: CareTaskPriority
  status: CareTaskStatus
  assignedContactId: string
  scheduledDate: string
  scheduledTime: string
  durationMinutes: number
  recurringRule?: string
  completedAt?: string
  createdAt: string
}

export interface CareSchedule {
  id: string
  elderlyId: string
  weekStart: string
  tasks: CareTask[]
}

export interface TodoItem {
  id: string
  elderlyId: string
  title: string
  source: TodoSyncSource
  sourceId?: string
  scheduledDate: string
  scheduledTime: string
  status: TodoSyncStatus
  assignedContactId?: string
  syncedAt?: string
  createdAt: string
}
