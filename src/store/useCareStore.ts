import { create } from 'zustand'
import type { Alert, Medication, Appointment, AppointmentStatus, CareTask, CareTaskStatus, TodoItem, TodoSyncStatus, CheckInRecord, TaskReminder, ReminderStatus, FollowUpAppointment, FollowUpAppointmentStatus, FollowUpRecord, DoctorSuggestion } from '@/types'
import { alerts as mockAlerts, medications as mockMedications, appointments as mockAppointments, careTasks as mockCareTasks, todoItems as mockTodoItems, checkInRecords as mockCheckInRecords, taskReminders as mockTaskReminders, followUpAppointments as mockFollowUpAppointments, followUpRecords as mockFollowUpRecords, doctorSuggestions as mockDoctorSuggestions } from '@/data/mockData'

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['family_pending', 'rejected'],
  family_pending: ['family_confirmed', 'family_rejected', 'cancelled'],
  family_confirmed: ['completed', 'cancelled'],
  completed: [],
  rejected: [],
  family_rejected: [],
  cancelled: [],
}

function canTransition(current: AppointmentStatus, target: AppointmentStatus): boolean {
  return VALID_TRANSITIONS[current].includes(target)
}

const FOLLOW_UP_TRANSITIONS: Record<FollowUpAppointmentStatus, FollowUpAppointmentStatus[]> = {
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
}

function canTransitionFollowUp(current: FollowUpAppointmentStatus, target: FollowUpAppointmentStatus): boolean {
  return FOLLOW_UP_TRANSITIONS[current].includes(target)
}

interface CareStore {
  alerts: Alert[]
  medications: Medication[]
  appointments: Appointment[]
  careTasks: CareTask[]
  todoItems: TodoItem[]
  checkInRecords: CheckInRecord[]
  taskReminders: TaskReminder[]
  resolveAlert: (id: string) => void
  toggleMedication: (id: string) => void
  approveAppointment: (id: string) => void
  rejectAppointment: (id: string, reason: string) => void
  familyConfirmAppointment: (id: string) => void
  familyRejectAppointment: (id: string, reason: string) => void
  completeAppointment: (id: string) => void
  cancelAppointment: (id: string) => void
  addAppointment: (appointment: Appointment) => void
  addCareTask: (task: CareTask) => void
  updateCareTask: (id: string, updates: Partial<CareTask>) => void
  deleteCareTask: (id: string) => void
  completeCareTask: (id: string) => void
  reassignCareTask: (id: string, contactId: string) => void
  addTodoItem: (item: TodoItem) => void
  updateTodoStatus: (id: string, status: TodoSyncStatus) => void
  syncTodoItem: (id: string) => void
  assignTodoItem: (id: string, contactId: string) => void
  checkInTask: (taskId: string, contactId: string, contactName: string, note: string) => void
  dismissReminder: (id: string) => void
  escalateReminder: (id: string) => void
  addReminder: (reminder: TaskReminder) => void
  followUpAppointments: FollowUpAppointment[]
  followUpRecords: FollowUpRecord[]
  doctorSuggestions: DoctorSuggestion[]
  addFollowUpAppointment: (appointment: FollowUpAppointment) => void
  confirmFollowUpAppointment: (id: string) => void
  cancelFollowUpAppointment: (id: string) => void
  completeFollowUpAppointment: (id: string) => void
  addFollowUpRecord: (record: FollowUpRecord) => void
  completeSuggestion: (id: string) => void
  addSuggestion: (suggestion: DoctorSuggestion) => void
}

export const useCareStore = create<CareStore>((set) => ({
  alerts: mockAlerts,
  medications: mockMedications,
  appointments: mockAppointments,
  careTasks: mockCareTasks,
  todoItems: mockTodoItems,
  checkInRecords: mockCheckInRecords,
  taskReminders: mockTaskReminders,
  followUpAppointments: mockFollowUpAppointments,
  followUpRecords: mockFollowUpRecords,
  doctorSuggestions: mockDoctorSuggestions,
  resolveAlert: (id: string) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, resolved: true } : a
      ),
    })),
  toggleMedication: (id: string) =>
    set((state) => ({
      medications: state.medications.map((m) =>
        m.id === id
          ? { ...m, status: m.status === 'taken' ? 'pending' : 'taken' }
          : m
      ),
    })),
  approveAppointment: (id: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id && canTransition(a.status, 'family_pending')
          ? { ...a, status: 'family_pending' as AppointmentStatus }
          : a
      ),
    })),
  rejectAppointment: (id: string, reason: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id && canTransition(a.status, 'rejected')
          ? { ...a, status: 'rejected' as AppointmentStatus, rejectReason: reason }
          : a
      ),
    })),
  familyConfirmAppointment: (id: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id && canTransition(a.status, 'family_confirmed')
          ? {
              ...a,
              status: 'family_confirmed' as AppointmentStatus,
              familyConfirmed: true,
              familyConfirmTime: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }).replace(/\//g, '-'),
            }
          : a
      ),
    })),
  familyRejectAppointment: (id: string, reason: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id && canTransition(a.status, 'family_rejected')
          ? {
              ...a,
              status: 'family_rejected' as AppointmentStatus,
              familyConfirmed: false,
              rejectReason: reason,
            }
          : a
      ),
    })),
  completeAppointment: (id: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id && canTransition(a.status, 'completed')
          ? { ...a, status: 'completed' as AppointmentStatus }
          : a
      ),
    })),
  cancelAppointment: (id: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id && canTransition(a.status, 'cancelled')
          ? { ...a, status: 'cancelled' as AppointmentStatus }
          : a
      ),
    })),
  addAppointment: (appointment: Appointment) =>
    set((state) => ({
      appointments: [appointment, ...state.appointments],
    })),
  addCareTask: (task: CareTask) =>
    set((state) => ({
      careTasks: [task, ...state.careTasks],
    })),
  updateCareTask: (id: string, updates: Partial<CareTask>) =>
    set((state) => ({
      careTasks: state.careTasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),
  deleteCareTask: (id: string) =>
    set((state) => ({
      careTasks: state.careTasks.filter((t) => t.id !== id),
    })),
  completeCareTask: (id: string) =>
    set((state) => ({
      careTasks: state.careTasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'completed' as CareTaskStatus,
              completedAt: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }).replace(/\//g, '-'),
            }
          : t
      ),
    })),
  reassignCareTask: (id: string, contactId: string) =>
    set((state) => ({
      careTasks: state.careTasks.map((t) =>
        t.id === id ? { ...t, assignedContactId: contactId } : t
      ),
    })),
  addTodoItem: (item: TodoItem) =>
    set((state) => ({
      todoItems: [item, ...state.todoItems],
    })),
  updateTodoStatus: (id: string, status: TodoSyncStatus) =>
    set((state) => ({
      todoItems: state.todoItems.map((t) =>
        t.id === id ? { ...t, status } : t
      ),
    })),
  syncTodoItem: (id: string) =>
    set((state) => ({
      todoItems: state.todoItems.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'synced' as TodoSyncStatus,
              syncedAt: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }).replace(/\//g, '-'),
            }
          : t
      ),
    })),
  assignTodoItem: (id: string, contactId: string) =>
    set((state) => ({
      todoItems: state.todoItems.map((t) =>
        t.id === id ? { ...t, assignedContactId: contactId } : t
      ),
    })),
  checkInTask: (taskId: string, contactId: string, contactName: string, note: string) =>
    set((state) => {
      const now = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(/\//g, '-')
      const record: CheckInRecord = {
        id: `ci${Date.now()}`,
        taskId,
        elderlyId: '1',
        contactId,
        contactName,
        note,
        checkInAt: now,
      }
      return {
        checkInRecords: [record, ...state.checkInRecords],
        careTasks: state.careTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'completed' as CareTaskStatus,
                completedAt: now,
              }
            : t
        ),
      }
    }),
  dismissReminder: (id: string) =>
    set((state) => ({
      taskReminders: state.taskReminders.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'dismissed' as ReminderStatus,
              dismissedAt: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }).replace(/\//g, '-'),
            }
          : r
      ),
    })),
  escalateReminder: (id: string) =>
    set((state) => ({
      taskReminders: state.taskReminders.map((r) =>
        r.id === id ? { ...r, status: 'escalated' as ReminderStatus } : r
      ),
    })),
  addReminder: (reminder: TaskReminder) =>
    set((state) => ({
      taskReminders: [reminder, ...state.taskReminders],
    })),
  addFollowUpAppointment: (appointment: FollowUpAppointment) =>
    set((state) => ({
      followUpAppointments: [appointment, ...state.followUpAppointments],
    })),
  confirmFollowUpAppointment: (id: string) =>
    set((state) => ({
      followUpAppointments: state.followUpAppointments.map((a) =>
        a.id === id && canTransitionFollowUp(a.status, 'confirmed')
          ? { ...a, status: 'confirmed' as FollowUpAppointmentStatus }
          : a
      ),
    })),
  cancelFollowUpAppointment: (id: string) =>
    set((state) => ({
      followUpAppointments: state.followUpAppointments.map((a) =>
        a.id === id && canTransitionFollowUp(a.status, 'cancelled')
          ? { ...a, status: 'cancelled' as FollowUpAppointmentStatus }
          : a
      ),
    })),
  completeFollowUpAppointment: (id: string) =>
    set((state) => ({
      followUpAppointments: state.followUpAppointments.map((a) =>
        a.id === id && canTransitionFollowUp(a.status, 'completed')
          ? { ...a, status: 'completed' as FollowUpAppointmentStatus }
          : a
      ),
    })),
  addFollowUpRecord: (record: FollowUpRecord) =>
    set((state) => ({
      followUpRecords: [record, ...state.followUpRecords],
    })),
  completeSuggestion: (id: string) =>
    set((state) => ({
      doctorSuggestions: state.doctorSuggestions.map((s) =>
        s.id === id
          ? {
              ...s,
              isActive: false,
              completedAt: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }).replace(/\//g, '-'),
            }
          : s
      ),
    })),
  addSuggestion: (suggestion: DoctorSuggestion) =>
    set((state) => ({
      doctorSuggestions: [suggestion, ...state.doctorSuggestions],
    })),
}))
