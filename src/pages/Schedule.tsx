import { useState, useMemo } from 'react'
import {
  CalendarDays,
  Plus,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ArrowRightLeft,
  RefreshCw,
  ListTodo,
  Users,
  Heart,
  Stethoscope,
  Home,
  MapPin,
  Brain,
  Wallet,
  ChevronDown,
  ChevronUp,
  Trash2,
  UserCheck,
  Link2,
} from 'lucide-react'
import { useCareStore } from '@/store/useCareStore'
import { contacts } from '@/data/mockData'
import type {
  CareTaskCategory,
  CareTaskPriority,
  CareTaskStatus,
  CareTask,
  TodoSyncSource,
  TodoSyncStatus,
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

const todoSourceConfig: Record<TodoSyncSource, { label: string; color: string; bg: string }> = {
  medication: { label: '用药', color: 'text-care-500', bg: 'bg-care-100' },
  appointment: { label: '预约', color: 'text-health-500', bg: 'bg-health-100' },
  alert: { label: '告警', color: 'text-danger-500', bg: 'bg-danger-100' },
  manual: { label: '手动', color: 'text-purple-500', bg: 'bg-purple-100' },
}

const todoStatusConfig: Record<TodoSyncStatus, { label: string; badge: string }> = {
  pending: { label: '待同步', badge: 'bg-amber-100 text-amber-700' },
  done: { label: '已完成', badge: 'bg-emerald-100 text-emerald-700' },
  synced: { label: '已同步', badge: 'bg-blue-100 text-blue-700' },
}

type TabKey = 'tasks' | 'todos' | 'family'

const tabs: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
  { key: 'tasks', label: '排班任务', icon: CalendarDays },
  { key: 'todos', label: '待办同步', icon: ListTodo },
  { key: 'family', label: '家属分工', icon: Users },
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

function getWeekDays(baseDate: Date): string[] {
  const result: string[] = []
  const start = new Date(baseDate)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    result.push(d.toISOString().split('T')[0])
  }
  return result
}

export default function Schedule() {
  const {
    careTasks,
    todoItems,
    addCareTask,
    completeCareTask,
    reassignCareTask,
    deleteCareTask,
    syncTodoItem,
    assignTodoItem,
  } = useCareStore()

  const [activeTab, setActiveTab] = useState<TabKey>('tasks')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState(initialTaskForm)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [reassignModalId, setReassignModalId] = useState<string | null>(null)
  const [reassignTarget, setReassignTarget] = useState('')
  const [filterCategory, setFilterCategory] = useState<CareTaskCategory | 'all'>('all')
  const [filterDate, setFilterDate] = useState('')

  const familyContacts = useMemo(() => contacts.filter((c) => c.elderlyId === '1'), [])

  const filteredTasks = useMemo(() => {
    let tasks = [...careTasks]
    if (filterCategory !== 'all') {
      tasks = tasks.filter((t) => t.category === filterCategory)
    }
    if (filterDate) {
      tasks = tasks.filter((t) => t.scheduledDate === filterDate)
    }
    return tasks.sort((a, b) => {
      const dateA = `${a.scheduledDate}T${a.scheduledTime}`
      const dateB = `${b.scheduledDate}T${b.scheduledTime}`
      return dateA.localeCompare(dateB)
    })
  }, [careTasks, filterCategory, filterDate])

  const stats = useMemo(() => {
    const pending = careTasks.filter((t) => t.status === 'pending').length
    const inProgress = careTasks.filter((t) => t.status === 'in_progress').length
    const completed = careTasks.filter((t) => t.status === 'completed').length
    const overdue = careTasks.filter((t) => t.status === 'overdue').length
    const unsyncedTodos = todoItems.filter((t) => t.status === 'pending').length
    return { pending, inProgress, completed, overdue, unsyncedTodos }
  }, [careTasks, todoItems])

  const familyWorkload = useMemo(() => {
    const workload: Record<string, { pending: number; completed: number; total: number }> = {}
    for (const contact of familyContacts) {
      const tasksForContact = careTasks.filter((t) => t.assignedContactId === contact.id)
      workload[contact.id] = {
        pending: tasksForContact.filter((t) => t.status === 'pending' || t.status === 'in_progress' || t.status === 'overdue').length,
        completed: tasksForContact.filter((t) => t.status === 'completed').length,
        total: tasksForContact.length,
      }
    }
    return workload
  }, [careTasks, familyContacts])

  const weekDays = useMemo(() => getWeekDays(new Date()), [])

  const weeklyGridData = useMemo(() => {
    const grid: Record<string, CareTask[]> = {}
    for (const day of weekDays) {
      grid[day] = careTasks.filter((t) => t.scheduledDate === day)
    }
    return grid
  }, [careTasks, weekDays])

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

  const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-6 animate-fade-in">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-warm-900">照护任务排班</h1>
            <p className="mt-1 text-sm text-warm-500">家属分工协作 · 服务预约 · 待办同步</p>
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
          <div className="rounded-xl bg-white p-4 shadow-sm border border-blue-200 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <p className="text-xs text-warm-500 mb-1">进行中</p>
            <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-emerald-200 animate-slide-up" style={{ animationDelay: '160ms' }}>
            <p className="text-xs text-warm-500 mb-1">已完成</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-red-200 animate-slide-up" style={{ animationDelay: '240ms' }}>
            <p className="text-xs text-warm-500 mb-1">逾期</p>
            <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-1 rounded-full bg-warm-200/60 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-white text-warm-900 shadow-sm'
                  : 'text-warm-500 hover:text-warm-700'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.key === 'todos' && stats.unsyncedTodos > 0 && (
                <span className="inline-flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-4 h-4">
                  {stats.unsyncedTodos}
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
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="rounded-lg border border-warm-300 px-3 py-2 text-sm text-warm-700 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none"
                placeholder="筛选日期"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-xs text-warm-500 hover:text-care-500 transition-colors self-center"
                >
                  清除日期
                </button>
              )}
            </div>

            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm animate-fade-in">
                <CalendarDays size={48} className="text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">暂无排班任务</p>
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

                  return (
                    <div
                      key={task.id}
                      className={`rounded-xl bg-white shadow-sm border border-warm-200 overflow-hidden animate-slide-up ${
                        task.status === 'completed' ? 'opacity-60' : ''
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
                              <span>{task.durationMinutes}分钟</span>
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

                          {isActive && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {task.status !== 'in_progress' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); completeCareTask(task.id) }}
                                  className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-xs font-medium transition-colors active:scale-95 flex items-center gap-1"
                                >
                                  <CheckCircle2 size={12} />
                                  完成任务
                                </button>
                              )}
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
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteCareTask(task.id) }}
                                className="rounded-lg bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-xs font-medium transition-colors active:scale-95 flex items-center gap-1"
                              >
                                <Trash2 size={12} />
                                删除
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

        {activeTab === 'todos' && (
          <div className="animate-fade-in">
            <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-center gap-2 text-sm text-blue-700 mb-1.5">
                <Link2 size={16} />
                <span className="font-medium">待办同步</span>
              </div>
              <p className="text-xs text-blue-600">
                来源于用药提醒、服务预约、异常告警的待办事项可同步至家属，确保信息不遗漏。
              </p>
            </div>

            {todoItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm">
                <ListTodo size={48} className="text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">暂无待办事项</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todoItems.map((todo, i) => {
                  const srcCfg = todoSourceConfig[todo.source]
                  const stCfg = todoStatusConfig[todo.status]
                  return (
                    <div
                      key={todo.id}
                      className={`rounded-xl bg-white shadow-sm border border-warm-200 p-4 animate-slide-up ${
                        todo.status === 'synced' ? 'opacity-60' : ''
                      }`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="mb-2 flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${srcCfg.bg} ${srcCfg.color}`}>
                              {srcCfg.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${stCfg.badge}`}>
                              {stCfg.label}
                            </span>
                          </div>
                          <p className="font-semibold text-warm-900 text-sm">{todo.title}</p>
                          <div className="mt-1.5 flex items-center gap-3 text-xs text-warm-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {todo.scheduledDate} {todo.scheduledTime}
                            </span>
                            {todo.assignedContactId && (
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {getContactShortName(todo.assignedContactId)}
                              </span>
                            )}
                            {todo.syncedAt && (
                              <span className="flex items-center gap-1 text-blue-500">
                                <RefreshCw size={12} />
                                {todo.syncedAt}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          {todo.status === 'pending' && (
                            <>
                              <button
                                onClick={() => syncTodoItem(todo.id)}
                                className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-xs font-medium transition-colors active:scale-95 flex items-center gap-1"
                              >
                                <RefreshCw size={11} />
                                同步
                              </button>
                              <select
                                value={todo.assignedContactId || ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    assignTodoItem(todo.id, e.target.value)
                                  }
                                }}
                                className="rounded-lg border border-warm-300 px-2 py-1.5 text-xs text-warm-700 focus:border-care-500 outline-none"
                              >
                                <option value="">分配给</option>
                                {familyContacts.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </>
                          )}
                          {todo.status === 'done' && (
                            <button
                              onClick={() => syncTodoItem(todo.id)}
                              className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-xs font-medium transition-colors active:scale-95 flex items-center gap-1"
                            >
                              <RefreshCw size={11} />
                              同步
                            </button>
                          )}
                          {todo.status === 'synced' && (
                            <span className="flex items-center gap-1 text-xs text-blue-500">
                              <CheckCircle2 size={12} />
                              已同步
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'family' && (
          <div className="animate-fade-in space-y-5">
            <div className="mb-4 rounded-xl bg-care-50 border border-care-200 p-4">
              <div className="flex items-center gap-2 text-sm text-care-700 mb-1.5">
                <Users size={16} />
                <span className="font-medium">家属分工看板</span>
              </div>
              <p className="text-xs text-care-600">
                查看各家属的任务分配情况，合理安排照护分工，避免任务过度集中。
              </p>
            </div>

            {familyContacts.map((contact, i) => {
              const wl = familyWorkload[contact.id] || { pending: 0, completed: 0, total: 0 }
              const contactTasks = careTasks.filter((t) => t.assignedContactId === contact.id)
              const activeTasks = contactTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress' || t.status === 'overdue')
              const maxLoad = Math.max(...Object.values(familyWorkload).map((w) => w.total), 1)
              const loadPercent = Math.round((wl.total / maxLoad) * 100)

              return (
                <div
                  key={contact.id}
                  className="rounded-xl bg-white shadow-sm border border-warm-200 p-5 animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                      contact.isEmergency ? 'bg-care-100 text-care-600' : 'bg-warm-100 text-warm-600'
                    }`}>
                      {contact.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-warm-900">{contact.name}</span>
                        <span className="text-xs text-warm-500 bg-warm-100 px-2 py-0.5 rounded-full">{contact.relationship}</span>
                        {contact.isEmergency && (
                          <span className="text-xs text-care-600 bg-care-100 px-2 py-0.5 rounded-full">紧急联系人</span>
                        )}
                      </div>
                      <p className="text-xs text-warm-400 mt-0.5">{contact.phone}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-warm-500">任务负载</span>
                      <span className="text-warm-700 font-medium">{wl.total}项 · 待办{wl.pending} · 完成{wl.completed}</span>
                    </div>
                    <div className="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-care-400 to-care-500 rounded-full transition-all"
                        style={{ width: `${loadPercent}%` }}
                      />
                    </div>
                  </div>

                  {activeTasks.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-warm-500 font-medium">待执行任务</p>
                      {activeTasks.map((task) => {
                        const catCfg = categoryConfig[task.category]
                        const CatIcon = catCfg.icon
                        const isOverdue = task.status === 'overdue'
                        return (
                          <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-warm-50">
                            <CatIcon size={14} className={catCfg.color} />
                            <span className="text-sm text-warm-800 flex-1 truncate">{task.title}</span>
                            <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-warm-400'}`}>
                              {task.scheduledTime}
                            </span>
                            {isOverdue && <AlertTriangle size={12} className="text-red-500" />}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-warm-400">暂无待执行任务</p>
                  )}
                </div>
              )
            })}

            <div className="rounded-xl bg-white shadow-sm border border-warm-200 p-5">
              <h3 className="text-sm font-semibold text-warm-800 mb-3 flex items-center gap-2">
                <CalendarDays size={16} className="text-care-500" />
                本周排班概览
              </h3>
              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day, i) => {
                      const isToday = day === new Date().toISOString().split('T')[0]
                      return (
                        <div key={day} className={`text-center text-xs font-medium py-1.5 rounded-lg ${isToday ? 'bg-care-500 text-white' : 'text-warm-500'}`}>
                          <div>{dayLabels[i]}</div>
                          <div className="mt-0.5">{day.slice(5)}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day) => {
                      const dayTasks = weeklyGridData[day] || []
                      const isToday = day === new Date().toISOString().split('T')[0]
                      return (
                        <div
                          key={day}
                          className={`rounded-lg border p-1.5 min-h-[80px] ${
                            isToday ? 'border-care-300 bg-care-50/50' : 'border-warm-100 bg-warm-50/50'
                          }`}
                        >
                          {dayTasks.length === 0 ? (
                            <p className="text-[10px] text-warm-300 text-center mt-4">无任务</p>
                          ) : (
                            <div className="space-y-1">
                              {dayTasks.slice(0, 3).map((task) => {
                                const catCfg = categoryConfig[task.category]
                                const isCompleted = task.status === 'completed'
                                return (
                                  <div
                                    key={task.id}
                                    className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                                      isCompleted
                                        ? 'bg-emerald-50 text-emerald-600 line-through'
                                        : task.status === 'overdue'
                                        ? 'bg-red-50 text-red-600'
                                        : `${catCfg.bg} ${catCfg.color}`
                                    }`}
                                  >
                                    {task.scheduledTime.slice(0, 5)} {task.title}
                                  </div>
                                )
                              })}
                              {dayTasks.length > 3 && (
                                <p className="text-[10px] text-warm-400 text-center">+{dayTasks.length - 3}项</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
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
                <CalendarDays size={20} className="text-care-500" />
                新增排班任务
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
    </div>
  )
}
