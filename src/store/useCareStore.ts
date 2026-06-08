import { create } from 'zustand'
import type { Alert, Medication, Appointment, AppointmentStatus, CareTask, CareTaskStatus, TodoItem, TodoSyncStatus } from '@/types'
import { alerts as mockAlerts, medications as mockMedications, appointments as mockAppointments, careTasks as mockCareTasks, todoItems as mockTodoItems } from '@/data/mockData'

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

interface CareStore {
  alerts: Alert[]
  medications: Medication[]
  appointments: Appointment[]
  careTasks: CareTask[]
  todoItems: TodoItem[]
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
}

export const useCareStore = create<CareStore>((set) => ({
  alerts: mockAlerts,
  medications: mockMedications,
  appointments: mockAppointments,
  careTasks: mockCareTasks,
  todoItems: mockTodoItems,
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
}))
