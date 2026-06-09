import type { CareTask, TaskReminder } from '@/types'
import { contacts } from '@/data/mockData'

function isTaskOverdue(task: CareTask): boolean {
  if (task.status === 'completed') return false
  if (task.status === 'overdue') return true

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  if (task.scheduledDate < today) return true
  if (task.scheduledDate === today) {
    const [h, m] = task.scheduledTime.split(':').map(Number)
    const scheduledMinutes = h * 60 + m
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    if (nowMinutes > scheduledMinutes + 30) return true
  }

  return false
}

function getOverdueDays(task: CareTask): number {
  const now = new Date()
  const scheduled = new Date(`${task.scheduledDate}T${task.scheduledTime}`)
  const diffMs = now.getTime() - scheduled.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function getContactInfo(contactId: string): { name: string; id: string } {
  const c = contacts.find((x) => x.id === contactId)
  return { name: c?.name ?? '未分配', id: contactId }
}

export function deriveReminders(
  careTasks: CareTask[],
  existingReminders: TaskReminder[]
): TaskReminder[] {
  const today = new Date().toISOString().split('T')[0]

  const dismissedTaskIds = new Set(
    existingReminders
      .filter((r) => r.status === 'dismissed')
      .map((r) => r.taskId)
  )

  const manuallyActiveTaskIds = new Set(
    existingReminders
      .filter((r) => r.status === 'active')
      .map((r) => r.taskId)
  )

  const overdueTasks = careTasks.filter(
    (t) => isTaskOverdue(t) && !dismissedTaskIds.has(t.id)
  )

  const derivedReminders: TaskReminder[] = overdueTasks.map((task) => {
    const contact = getContactInfo(task.assignedContactId)
    const overdueDays = getOverdueDays(task)
    let message: string

    if (overdueDays === 0) {
      message = `「${task.title}」已超过预定时间（${task.scheduledTime}），请尽快处理。`
    } else if (overdueDays === 1) {
      message = `「${task.title}」已于昨日到期，至今未完成，请尽快处理。`
    } else {
      message = `「${task.title}」已逾期${overdueDays}天，原定于${task.scheduledDate} ${task.scheduledTime}执行，请尽快处理。`
    }

    const isEscalated = existingReminders.some(
      (r) => r.taskId === task.id && r.status === 'escalated'
    )

    return {
      id: `derived-${task.id}`,
      taskId: task.id,
      elderlyId: task.elderlyId,
      contactId: contact.id,
      contactName: contact.name,
      message,
      status: isEscalated ? 'escalated' as const : 'active' as const,
      createdAt: task.scheduledDate < today ? `${task.scheduledDate} ${task.scheduledTime}` : `${today} ${task.scheduledTime}`,
    }
  })

  const manualNonOverdue = existingReminders.filter(
    (r) => !r.id.startsWith('derived-') && !overdueTasks.some((t) => t.id === r.taskId)
  )

  const manualDismissedOrEscalated = existingReminders.filter(
    (r) => !r.id.startsWith('derived-') && (r.status === 'dismissed' || r.status === 'escalated')
  )

  const uniqueManual = [...manualNonOverdue, ...manualDismissedOrEscalated].filter(
    (r, i, arr) => arr.findIndex((x) => x.id === r.id) === i
  )

  return [...derivedReminders, ...uniqueManual]
}

export function deriveOverdueTasks(careTasks: CareTask[]): CareTask[] {
  return careTasks.filter(isTaskOverdue)
}

export { isTaskOverdue }
