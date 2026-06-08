import { useState, useMemo } from 'react'
import {
  ClipboardList,
  CheckCircle2,
  Bell,
  Users,
  Plus,
  X,
  Clock,
  User,
  AlertTriangle,
  Heart,
  Stethoscope,
  Home,
  MapPin,
  Brain,
  Wallet,
  Phone,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  ShieldAlert,
  CheckCheck,
  UserCheck,
  Volume2,
} from 'lucide-react'
import { useCareStore } from '@/store/useCareStore'
import { contacts } from '@/data/mockData'
import type {
  CareTaskCategory,
  CareTaskPriority,
  CareTaskStatus,
  CareTask,
  ReminderStatus,
} from '@/types'

const categoryConfig: Record<CareTaskCategory, { label: string; icon: typeof Home; color: string; bg: string }> = {
  daily_care: { label: '日常照护', icon: Heart, color: 'text-care-500', bg: 'bg-care-100' },
  medical: { label: '医疗健康', icon: Stethoscope, color: 'text-health-500', bg: 'bg-health-100' },
  housework: { label: '家务劳动', icon: Home, color: 'text-purple-500', bg: 'bg-purple-100' },
  accompany: { label: '出行陪护', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-100' },
  emotional: { label: '心理关怀', icon: Brain, color: 'text-pink-500', bg: 'bg-pink-100' },
  finance: { label: '财务代办', icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-100' },
}

const priorityConfig: Record<CareTaskPriority, { label: string; badge: string }> = {
  high: { label: '高', badge: 'bg-red-100 text-red-600' },
  medium: { label: '中', badge: 'bg-amber-100 text-amber-600' },
  low: { label: '低', badge: 'bg-emerald-100 text-emerald-600' },
}

const taskStatusConfig: Record<CareTaskStatus, { label: string; badge: string; dot: string }> = {
  pending: { label: '待执行', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  in_progress: { label: '进行中', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  completed: { label: '已完成', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  overdue: { label: '已逾期', badge: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
}

const reminderStatusConfig: Record<ReminderStatus, { label: string; badge: string; icon: typeof Bell }> = {
  active: { label: '待处理', badge: 'bg-amber-100 text-amber-700', icon: Bell },
  dismissed: { label: '已忽略', badge: 'bg-warm-100 text-warm-500', icon: CheckCircle2 },
  escalated: { label: '已升级', badge: 'bg-red-100 text-red-700', icon: ShieldAlert },
}

type TabKey = 'tasks' | 'checkin' | 'reminders' | 'contacts'

const tabs: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
  { key: 'tasks', label: '任务管理', icon: ClipboardList },
  { key: 'checkin', label: '完成打卡', icon: CheckCircle2 },
  { key: 'reminders', label: '逾期提醒', icon: Bell },
  { key: 'contacts', label: '联系人联动', icon: Users },
]

const categoryOptions: { value: CareTaskCategory; label: string }[] = [
  { value: 'daily_care', label: '日常照护' },
  { value: 'medical', label: '医疗健康' },
  { value: 'housework', label: '家务劳动' },
  { value: 'accompany', label: '出行陪护' },
  { value: 'emotional', label: '心理关怀' },
  { value: 'finance', label: '财务代办' },
]

const priorityOptions: { value: CareTaskPriority; label: string }[] = [
  { value: 'high', label: '高优先' },
  { value: 'medium', label: '中优先' },
  { value: 'low', label: '低优先' },
]

const initialTaskForm = {
  title: '',
  description: '',
  category: '' as CareTaskCategory | '',
  priority: 'medium' as CareTaskPriority,
  assignedContactId: '',
  scheduledDate: '',
  scheduledTime: '',
  durationMinutes: 30,
  recurringRule: '',
}

const getContactName = (contactId: string) => {
  const contact = contacts.find((c) => c.id === contactId)
  return contact ? `${contact.name}（${contact.relationship}）` : '未分配'
}

const getContactShortName = (contactId: string) => {
  const contact = contacts.find((c) => c.id === contactId)
  return contact ? contact.name : '未分配'
}

const avatarColors: Record<string, string> = {
  '儿子': 'bg-care-500',
  '女儿': 'bg-health-500',
  '女婿': 'bg-info-500',
  '儿媳': 'bg-care-400',
  '孙子': 'bg-health-400',
  '家庭医生': 'bg-danger-500',
}

function getAvatarColor(relationship: string) {
  return avatarColors[relationship] || 'bg-warm-400'
}

export default function FamilyCareTask() {
  const {
    careTasks,
    checkInRecords,
    taskReminders,
    addCareTask,
    reassignCareTask,
    checkInTask,
    dismissReminder,
    escalateReminder,
  } = useCareStore()

  const [activeTab, setActiveTab] = useState<TabKey>('tasks')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState(initialTaskForm)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [reassignModalId, setReassignModalId] = useState<string | null>(null)
  const [reassignTarget, setReassignTarget] = useState('')
  const [filterCategory, setFilterCategory] = useState<CareTaskCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<CareTaskStatus | 'all'>('all')
  const [checkInModalTaskId, setCheckInModalTaskId] = useState<string | null>(null)
  const [checkInNote, setCheckInNote] = useState('')
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

  const familyContacts = useMemo(() => contacts.filter((c) => c.elderlyId === '1'), [])

  const activeTasks = useMemo(() => {
    return careTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress' || t.status === 'overdue')
  }, [careTasks])

  const filteredTasks = useMemo(() => {
    let tasks = [...careTasks]
    if (filterCategory !== 'all') {
      tasks = tasks.filter((t) => t.category === filterCategory)
    }
    if (filterStatus !== 'all') {
      tasks = tasks.filter((t) => t.status === filterStatus)
    }
    return tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (a.status === 'overdue' && b.status !== 'overdue') return -1
      if (b.status === 'overdue' && a.status !== 'overdue') return 1
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return `${a.scheduledDate}T${a.scheduledTime}`.localeCompare(`${b.scheduledDate}T${b.scheduledTime}`)
    })
  }, [careTasks, filterCategory, filterStatus])

  const activeReminders = useMemo(() => {
    return taskReminders.filter((r) => r.status === 'active')
  }, [taskReminders])

  const stats = useMemo(() => {
    const pending = careTasks.filter((t) => t.status === 'pending').length
    const inProgress = careTasks.filter((t) => t.status === 'in_progress').length
    const completed = careTasks.filter((t) => t.status === 'completed').length
    const overdue = careTasks.filter((t) => t.status === 'overdue').length
    const todayCheckIns = checkInRecords.filter((r) => r.checkInAt.startsWith('2026-06-08')).length
    const totalCheckIns = checkInRecords.length
    return { pending, inProgress, completed, overdue, todayCheckIns, totalCheckIns }
  }, [careTasks, checkInRecords])

  const contactTaskMap = useMemo(() => {
    const map: Record<string, { contact: typeof contacts[0]; tasks: CareTask[]; checkIns: typeof checkInRecords }> = {}
    for (const contact of familyContacts) {
      const contactTasks = careTasks.filter((t) => t.assignedContactId === contact.id)
      const contactCheckIns = checkInRecords.filter((r) => r.contactId === contact.id)
      map[contact.id] = { contact, tasks: contactTasks, checkIns: contactCheckIns }
    }
    return map
  }, [familyContacts, careTasks, checkInRecords])

  const handleAddTask = () => {
    if (!taskForm.title || !taskForm.category || !taskForm.assignedContactId || !taskForm.scheduledDate || !taskForm.scheduledTime) return
    const newTask: CareTask = {
      id: `ct${Date.now()}`,
      elderlyId: '1',
      title: taskForm.title,
      description: taskForm.description,
      category: taskForm.category as CareTaskCategory,
      priority: taskForm.priority,
      status: 'pending',
      assignedContactId: taskForm.assignedContactId,
      scheduledDate: taskForm.scheduledDate,
      scheduledTime: taskForm.scheduledTime,
      durationMinutes: taskForm.durationMinutes,
      recurringRule: taskForm.recurringRule || undefined,
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(/\//g, '-'),
    }
    addCareTask(newTask)
    setTaskForm(initialTaskForm)
    setShowTaskForm(false)
  }

  const handleReassign = () => {
    if (!reassignModalId || !reassignTarget) return
    reassignCareTask(reassignModalId, reassignTarget)
    setReassignModalId(null)
    setReassignTarget('')
  }

  const handleCheckIn = () => {
    if (!checkInModalTaskId) return
    const task = careTasks.find((t) => t.id === checkInModalTaskId)
    if (!task) return
    const contact = contacts.find((c) => c.id === task.assignedContactId)
    checkInTask(
      checkInModalTaskId,
      task.assignedContactId,
      contact?.name || '未知',
      checkInNote
    )
    setCheckInModalTaskId(null)
    setCheckInNote('')
  }

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-6 animate-fade-in">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-warm-900">家庭协同关怀</h1>
            <p className="mt-1 text-sm text-warm-500">任务创建 · 分派协作 · 完成打卡 · 逾期提醒</p>
          </div>
          <button
            onClick={() => setShowTaskForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-care-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-care-600 active:scale-95"
          >
            <Plus size={16} />
            新增任务
          </button>
        </header>

        <div className="mb-6 grid grid-cols-4 gap-3">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-amber-200 animate-slide-up">
            <p className="text-xs text-warm-500 mb-1">待执行</p>
            <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-emerald-200 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <p className="text-xs text-warm-500 mb-1">已打卡</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.totalCheckIns}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-red-200 animate-slide-up" style={{ animationDelay: '160ms' }}>
            <p className="text-xs text-warm-500 mb-1">逾期</p>
            <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-blue-200 animate-slide-up" style={{ animationDelay: '240ms' }}>
            <p className="text-xs text-warm-500 mb-1">提醒</p>
            <p className="text-2xl font-bold text-blue-500">{activeReminders.length}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-1 rounded-full bg-warm-200/60 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                activeTab === tab.key
                  ? 'bg-white text-warm-900 shadow-sm'
                  : 'text-warm-500 hover:text-warm-700'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.key === 'reminders' && activeReminders.length > 0 && (
                <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs rounded-full w-4 h-4">
                  {activeReminders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'tasks' && (
          <div className="animate-fade-in">
            <div className="mb-4 flex gap-3 flex-wrap">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as CareTaskCategory | 'all')}
                className="rounded-lg border border-warm-300 px-3 py-2 text-sm text-warm-700 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none"
              >
                <option value="all">全部分类</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as CareTaskStatus | 'all')}
                className="rounded-lg border border-warm-300 px-3 py-2 text-sm text-warm-700 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none"
              >
                <option value="all">全部状态</option>
                <option value="pending">待执行</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="overdue">已逾期</option>
              </select>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm animate-fade-in">
                <ClipboardList size={48} className="text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">暂无任务</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task, i) => {
                  const catCfg = categoryConfig[task.category]
                  const stCfg = taskStatusConfig[task.status]
                  const priCfg = priorityConfig[task.priority]
                  const CatIcon = catCfg.icon
                  const isExpanded = expandedTaskId === task.id
                  const isActive = task.status === 'pending' || task.status === 'in_progress' || task.status === 'overdue'
                  const taskCheckIns = checkInRecords.filter((r) => r.taskId === task.id)

                  return (
                    <div
                      key={task.id}
                      className={`rounded-xl bg-white shadow-sm border overflow-hidden animate-slide-up ${
                        task.status === 'completed' ? 'opacity-60 border-warm-200' :
                        task.status === 'overdue' ? 'border-red-200 border-l-4 border-l-red-500' :
                        'border-warm-200'
                      }`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${catCfg.bg} ${catCfg.color}`}>
                                <CatIcon size={12} />
                                {catCfg.label}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${stCfg.badge}`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${stCfg.dot}`} />
                                {stCfg.label}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priCfg.badge}`}>
                                {priCfg.label}
                              </span>
                            </div>
                            <p className="font-semibold text-warm-900 text-sm">{task.title}</p>
                            <div className="mt-1.5 flex items-center gap-3 text-xs text-warm-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {task.scheduledDate} {task.scheduledTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {getContactShortName(task.assignedContactId)}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-warm-400 mt-1">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-warm-100 px-4 pb-4 pt-3 animate-fade-in">
                          <div className="space-y-2.5 text-sm">
                            {task.description && (
                              <div className="flex gap-2">
                                <span className="text-warm-400 w-20 shrink-0">任务描述</span>
                                <span className="text-warm-700">{task.description}</span>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <span className="text-warm-400 w-20 shrink-0">负责人</span>
                              <span className="text-warm-700 flex items-center gap-1">
                                <UserCheck size={14} className="text-care-500" />
                                {getContactName(task.assignedContactId)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-warm-400 w-20 shrink-0">预计时长</span>
                              <span className="text-warm-700">{task.durationMinutes}分钟</span>
                            </div>
                            {task.recurringRule && (
                              <div className="flex gap-2">
                                <span className="text-warm-400 w-20 shrink-0">重复规则</span>
                                <span className="text-warm-700">
                                  {task.recurringRule === 'daily' ? '每日' : task.recurringRule === 'weekly' ? '每周' : task.recurringRule}
                                </span>
                              </div>
                            )}
                            {task.completedAt && (
                              <div className="flex gap-2">
                                <span className="text-warm-400 w-20 shrink-0">完成时间</span>
                                <span className="text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 size={14} />
                                  {task.completedAt}
                                </span>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <span className="text-warm-400 w-20 shrink-0">创建时间</span>
                              <span className="text-warm-500 text-xs">{task.createdAt}</span>
                            </div>
                          </div>

                          {taskCheckIns.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-warm-500 font-medium mb-2 flex items-center gap-1">
                                <CheckCheck size={12} />
                                打卡记录
                              </p>
                              <div className="space-y-2">
                                {taskCheckIns.map((record) => (
                                  <div key={record.id} className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="text-emerald-700 font-medium">{record.contactName}</span>
                                      <span className="text-emerald-500">{record.checkInAt}</span>
                                    </div>
                                    {record.note && <p className="text-xs text-emerald-600">{record.note}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {isActive && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCheckInModalTaskId(task.id)
                                  setCheckInNote('')
                                }}
                                className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-xs font-medium transition-colors active:scale-95 flex items-center gap-1"
                              >
                                <CheckCircle2 size={12} />
                                打卡完成
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setReassignModalId(task.id)
                                  setReassignTarget(task.assignedContactId)
                                }}
                                className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-medium transition-colors active:scale-95 flex items-center gap-1"
                              >
                                <ArrowRightLeft size={12} />
                                转派
                              </button>
                            </div>
                          )}

                          {task.status === 'overdue' && (
                            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                              <div className="flex items-center gap-2 text-sm text-red-700 mb-1">
                                <AlertTriangle size={16} />
                                <span className="font-medium">任务已逾期</span>
                              </div>
                              <p className="text-xs text-red-600">
                                此任务原定于 {task.scheduledDate} {task.scheduledTime} 执行，请尽快处理或重新安排。
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'checkin' && (
          <div className="animate-fade-in space-y-5">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center gap-2 text-sm text-emerald-700 mb-1.5">
                <CheckCheck size={16} />
                <span className="font-medium">完成打卡</span>
              </div>
              <p className="text-xs text-emerald-600">
                完成照护任务后进行打卡确认，记录执行情况和老人状态，方便家属之间信息同步。
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-warm-700 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                待打卡任务
              </h3>
              {activeTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-12 shadow-sm border border-warm-200">
                  <CheckCircle2 size={40} className="text-emerald-300 mb-2" />
                  <p className="text-warm-500 text-sm">所有任务已完成</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTasks.map((task, i) => {
                    const catCfg = categoryConfig[task.category]
                    const CatIcon = catCfg.icon
                    const isOverdue = task.status === 'overdue'
                    return (
                      <div
                        key={task.id}
                        className={`rounded-xl bg-white shadow-sm border p-4 animate-slide-up ${
                          isOverdue ? 'border-red-200' : 'border-warm-200'
                        }`}
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${catCfg.bg} ${catCfg.color}`}>
                                <CatIcon size={12} />
                                {catCfg.label}
                              </span>
                              {isOverdue && (
                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                                  <AlertTriangle size={10} />
                                  已逾期
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-warm-900 text-sm">{task.title}</p>
                            <div className="mt-1.5 flex items-center gap-3 text-xs text-warm-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {task.scheduledDate} {task.scheduledTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {getContactShortName(task.assignedContactId)}
                              </span>
                              <span>{task.durationMinutes}分钟</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setCheckInModalTaskId(task.id)
                              setCheckInNote('')
                            }}
                            className="shrink-0 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 text-xs font-medium transition-colors active:scale-95 flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={14} />
                            打卡
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-warm-700 mb-3 flex items-center gap-2">
                <CheckCheck size={16} className="text-emerald-500" />
                打卡记录
              </h3>
              {checkInRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-12 shadow-sm border border-warm-200">
                  <MessageSquare size={40} className="text-warm-300 mb-2" />
                  <p className="text-warm-500 text-sm">暂无打卡记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checkInRecords.map((record, i) => {
                    const task = careTasks.find((t) => t.id === record.taskId)
                    return (
                      <div
                        key={record.id}
                        className="rounded-xl bg-white shadow-sm border border-emerald-200 p-4 animate-slide-up"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(contacts.find(c => c.id === record.contactId)?.relationship || '')} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                            {record.contactName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-warm-900 text-sm">{record.contactName}</span>
                              <span className="text-xs text-warm-400">{record.checkInAt}</span>
                            </div>
                            <p className="text-sm text-warm-700">
                              完成了「{task?.title || '未知任务'}」
                            </p>
                            {record.note && (
                              <div className="mt-2 rounded-lg bg-warm-50 border border-warm-200 p-2.5">
                                <p className="text-xs text-warm-600">{record.note}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="animate-fade-in space-y-5">
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-2 text-sm text-red-700 mb-1.5">
                <Bell size={16} />
                <span className="font-medium">逾期提醒</span>
              </div>
              <p className="text-xs text-red-600">
                系统自动检测逾期和即将到期的任务，发送提醒给相关家属，确保照护不遗漏。可升级至紧急联系人以加强催促。
              </p>
            </div>

            {taskReminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm border border-warm-200">
                <Bell size={48} className="text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">暂无提醒</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-warm-700 mb-3 flex items-center gap-2">
                    <Bell size={16} className="text-amber-500" />
                    待处理提醒
                    {activeReminders.length > 0 && (
                      <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs rounded-full w-5 h-5">
                        {activeReminders.length}
                      </span>
                    )}
                  </h3>
                  {activeReminders.length === 0 ? (
                    <div className="rounded-xl bg-white p-6 text-center text-warm-400 text-sm border border-warm-200">
                      所有提醒已处理
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeReminders.map((reminder, i) => {
                        const task = careTasks.find((t) => t.id === reminder.taskId)
                        const isOverdue = task?.status === 'overdue'
                        return (
                          <div
                            key={reminder.id}
                            className={`rounded-xl bg-white shadow-sm border p-4 animate-slide-up ${
                              isOverdue ? 'border-red-300 border-l-4 border-l-red-500' : 'border-amber-200'
                            }`}
                            style={{ animationDelay: `${i * 50}ms` }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                isOverdue ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-500'
                              }`}>
                                <Volume2 size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-warm-900 text-sm">
                                    {isOverdue ? '逾期提醒' : '任务提醒'}
                                  </span>
                                  <span className="text-xs text-warm-400">{reminder.createdAt}</span>
                                </div>
                                <p className="text-sm text-warm-700 mb-2">{reminder.message}</p>
                                <div className="flex items-center gap-2 text-xs text-warm-500">
                                  <span className="flex items-center gap-1">
                                    <User size={12} />
                                    {reminder.contactName}
                                  </span>
                                  {task && (
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} />
                                      {task.scheduledDate} {task.scheduledTime}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-3 flex gap-2">
                                  {isOverdue && (
                                    <button
                                      onClick={() => escalateReminder(reminder.id)}
                                      className="rounded-lg bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-medium transition-colors active:scale-95 flex items-center gap-1"
                                    >
                                      <ShieldAlert size={12} />
                                      升级提醒
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (task) {
                                        setCheckInModalTaskId(task.id)
                                        setCheckInNote('')
                                      }
                                    }}
                                    className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 text-xs font-medium transition-colors active:scale-95 flex items-center gap-1"
                                  >
                                    <CheckCircle2 size={12} />
                                    立即打卡
                                  </button>
                                  <button
                                    onClick={() => dismissReminder(reminder.id)}
                                    className="rounded-lg border border-warm-300 text-warm-600 hover:bg-warm-50 px-3 py-1.5 text-xs font-medium transition-colors active:scale-95"
                                  >
                                    忽略
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-warm-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-warm-400" />
                    已处理提醒
                  </h3>
                  <div className="space-y-2">
                    {taskReminders
                      .filter((r) => r.status !== 'active')
                      .map((reminder) => {
                        const rCfg = reminderStatusConfig[reminder.status]
                        const RIcon = rCfg.icon
                        return (
                          <div
                            key={reminder.id}
                            className="rounded-xl bg-white shadow-sm border border-warm-200 p-4 opacity-60"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-warm-100 text-warm-400 flex items-center justify-center shrink-0">
                                <RIcon size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${rCfg.badge}`}>
                                    {rCfg.label}
                                  </span>
                                  <span className="text-xs text-warm-400">{reminder.createdAt}</span>
                                </div>
                                <p className="text-sm text-warm-600">{reminder.message}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="animate-fade-in space-y-5">
            <div className="rounded-xl bg-care-50 border border-care-200 p-4">
              <div className="flex items-center gap-2 text-sm text-care-700 mb-1.5">
                <Users size={16} />
                <span className="font-medium">联系人联动</span>
              </div>
              <p className="text-xs text-care-600">
                查看各家属的任务分配与完成情况，一键联系负责人，快速了解照护协作全貌。
              </p>
            </div>

            <div className="mb-4">
              <p className="text-xs text-warm-500 mb-2">按联系人筛选</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedContactId(null)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedContactId === null
                      ? 'bg-care-500 text-white'
                      : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                  }`}
                >
                  全部
                </button>
                {familyContacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContactId(c.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedContactId === c.id
                        ? 'bg-care-500 text-white'
                        : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {(selectedContactId ? [selectedContactId] : Object.keys(contactTaskMap)).map((contactId, i) => {
              const entry = contactTaskMap[contactId]
              if (!entry) return null
              const { contact, tasks: contactTasks, checkIns: contactCheckIns } = entry
              const activeContactTasks = contactTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress' || t.status === 'overdue')
              const completedContactTasks = contactTasks.filter((t) => t.status === 'completed')
              const overdueContactTasks = contactTasks.filter((t) => t.status === 'overdue')

              return (
                <div
                  key={contactId}
                  className="rounded-xl bg-white shadow-sm border border-warm-200 overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-full ${getAvatarColor(contact.relationship)} flex items-center justify-center text-white text-xl font-bold shrink-0`}>
                        {contact.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-warm-800 text-lg">{contact.name}</span>
                          <span className="text-xs text-warm-500 bg-warm-100 px-2 py-0.5 rounded-full">{contact.relationship}</span>
                          {contact.isEmergency && (
                            <span className="text-xs text-care-600 bg-care-100 px-2 py-0.5 rounded-full">紧急联系人</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-warm-500">
                            <Phone size={12} />
                            {contact.phone}
                          </span>
                        </div>
                      </div>
                      <button className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-care-50 text-care-500 hover:bg-care-100 hover:text-care-600 transition-colors active:scale-95">
                        <Phone className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="rounded-lg bg-warm-50 p-2.5 text-center">
                        <p className="text-lg font-bold text-warm-800">{contactTasks.length}</p>
                        <p className="text-[10px] text-warm-500">总任务</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-2.5 text-center">
                        <p className="text-lg font-bold text-amber-600">{activeContactTasks.length}</p>
                        <p className="text-[10px] text-warm-500">进行中</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-2.5 text-center">
                        <p className="text-lg font-bold text-emerald-600">{completedContactTasks.length}</p>
                        <p className="text-[10px] text-warm-500">已完成</p>
                      </div>
                      <div className="rounded-lg bg-red-50 p-2.5 text-center">
                        <p className="text-lg font-bold text-red-600">{overdueContactTasks.length}</p>
                        <p className="text-[10px] text-warm-500">逾期</p>
                      </div>
                    </div>

                    {activeContactTasks.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-warm-500 font-medium mb-2 flex items-center gap-1">
                          <Clock size={12} />
                          待执行任务
                        </p>
                        <div className="space-y-2">
                          {activeContactTasks.map((task) => {
                            const catCfg = categoryConfig[task.category]
                            const CatIcon = catCfg.icon
                            const isOverdue = task.status === 'overdue'
                            return (
                              <div
                                key={task.id}
                                className={`flex items-center gap-2 p-2.5 rounded-lg ${
                                  isOverdue ? 'bg-red-50 border border-red-200' : 'bg-warm-50'
                                }`}
                              >
                                <CatIcon size={14} className={catCfg.color} />
                                <span className="text-sm text-warm-800 flex-1 truncate">{task.title}</span>
                                <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-warm-400'}`}>
                                  {task.scheduledDate.slice(5)} {task.scheduledTime}
                                </span>
                                {isOverdue && <AlertTriangle size={12} className="text-red-500" />}
                                <button
                                  onClick={() => {
                                    setCheckInModalTaskId(task.id)
                                    setCheckInNote('')
                                  }}
                                  className="shrink-0 rounded bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 text-[10px] font-medium transition-colors active:scale-95"
                                >
                                  打卡
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {contactCheckIns.length > 0 && (
                      <div>
                        <p className="text-xs text-warm-500 font-medium mb-2 flex items-center gap-1">
                          <CheckCheck size={12} />
                          最近打卡
                        </p>
                        <div className="space-y-1.5">
                          {contactCheckIns.slice(0, 3).map((record) => {
                            const task = careTasks.find((t) => t.id === record.taskId)
                            return (
                              <div key={record.id} className="flex items-center gap-2 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                <span className="text-warm-600 truncate flex-1">
                                  「{task?.title || '未知'}」{record.note ? ` - ${record.note}` : ''}
                                </span>
                                <span className="text-warm-400 shrink-0">{record.checkInAt.slice(5)}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-warm-100 flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-care-50 text-care-600 hover:bg-care-100 py-2 text-xs font-medium transition-colors active:scale-95">
                        <Send size={12} />
                        发送提醒
                      </button>
                      <button
                        onClick={() => {
                          const firstActiveTask = activeContactTasks[0]
                          if (firstActiveTask) {
                            setReassignModalId(firstActiveTask.id)
                            setReassignTarget(firstActiveTask.assignedContactId)
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 text-xs font-medium transition-colors active:scale-95"
                      >
                        <ArrowRightLeft size={12} />
                        转派任务
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setShowTaskForm(false)}>
          <div
            className="w-full max-w-lg mx-4 rounded-2xl bg-white shadow-xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
              <h2 className="text-lg font-semibold text-warm-900 flex items-center gap-2">
                <ClipboardList size={20} className="text-care-500" />
                创建协同任务
              </h2>
              <button onClick={() => setShowTaskForm(false)} className="text-warm-400 hover:text-warm-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">任务名称 <span className="text-danger-500">*</span></label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="请输入任务名称"
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">任务描述</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="请输入任务描述"
                  rows={2}
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">任务分类 <span className="text-danger-500">*</span></label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as CareTaskCategory })}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  >
                    <option value="">请选择分类</option>
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">优先级</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as CareTaskPriority })}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  >
                    {priorityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">负责人 <span className="text-danger-500">*</span></label>
                <select
                  value={taskForm.assignedContactId}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedContactId: e.target.value })}
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                >
                  <option value="">请选择负责人</option>
                  {familyContacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}（{c.relationship}）</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">日期 <span className="text-danger-500">*</span></label>
                  <input
                    type="date"
                    value={taskForm.scheduledDate}
                    onChange={(e) => setTaskForm({ ...taskForm, scheduledDate: e.target.value })}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">时间 <span className="text-danger-500">*</span></label>
                  <input
                    type="time"
                    value={taskForm.scheduledTime}
                    onChange={(e) => setTaskForm({ ...taskForm, scheduledTime: e.target.value })}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">预计时长（分钟）</label>
                  <input
                    type="number"
                    value={taskForm.durationMinutes}
                    onChange={(e) => setTaskForm({ ...taskForm, durationMinutes: Number(e.target.value) || 30 })}
                    min={5}
                    step={5}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">重复规则</label>
                  <select
                    value={taskForm.recurringRule}
                    onChange={(e) => setTaskForm({ ...taskForm, recurringRule: e.target.value })}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  >
                    <option value="">不重复</option>
                    <option value="daily">每日</option>
                    <option value="weekly">每周</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => setShowTaskForm(false)}
                className="rounded-lg border border-warm-300 px-5 py-2.5 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddTask}
                disabled={!taskForm.title || !taskForm.category || !taskForm.assignedContactId || !taskForm.scheduledDate || !taskForm.scheduledTime}
                className="rounded-lg bg-care-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-care-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建任务
              </button>
            </div>
          </div>
        </div>
      )}

      {reassignModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setReassignModalId(null)}>
          <div
            className="w-full max-w-sm mx-4 rounded-2xl bg-white shadow-xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
              <h2 className="text-base font-semibold text-warm-900 flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-blue-500" />
                转派任务
              </h2>
              <button onClick={() => setReassignModalId(null)} className="text-warm-400 hover:text-warm-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-warm-700 mb-1.5">转派给</label>
              <select
                value={reassignTarget}
                onChange={(e) => setReassignTarget(e.target.value)}
                className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
              >
                <option value="">请选择家属</option>
                {familyContacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}（{c.relationship}）</option>
                ))}
              </select>
            </div>
            <div className="px-6 py-4 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => setReassignModalId(null)}
                className="rounded-lg border border-warm-300 px-5 py-2.5 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReassign}
                disabled={!reassignTarget}
                className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认转派
              </button>
            </div>
          </div>
        </div>
      )}

      {checkInModalTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setCheckInModalTaskId(null)}>
          <div
            className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
              <h2 className="text-base font-semibold text-warm-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" />
                任务打卡
              </h2>
              <button onClick={() => setCheckInModalTaskId(null)} className="text-warm-400 hover:text-warm-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              {(() => {
                const task = careTasks.find((t) => t.id === checkInModalTaskId)
                if (!task) return null
                const catCfg = categoryConfig[task.category]
                const CatIcon = catCfg.icon
                return (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${catCfg.bg} ${catCfg.color}`}>
                        <CatIcon size={12} />
                        {catCfg.label}
                      </span>
                    </div>
                    <p className="font-semibold text-warm-900">{task.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-warm-500">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {getContactName(task.assignedContactId)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {task.scheduledDate} {task.scheduledTime}
                      </span>
                    </div>
                  </div>
                )
              })()}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">打卡备注</label>
                <textarea
                  value={checkInNote}
                  onChange={(e) => setCheckInNote(e.target.value)}
                  placeholder="请输入完成情况说明，如：已完成，老人状态良好"
                  rows={3}
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => setCheckInModalTaskId(null)}
                className="rounded-lg border border-warm-300 px-5 py-2.5 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCheckIn}
                className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                确认打卡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
