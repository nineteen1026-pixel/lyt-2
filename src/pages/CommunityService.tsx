import { useState, useMemo } from 'react'
import {
  CalendarCheck,
  Home,
  Stethoscope,
  Sparkles,
  MapPin,
  Brain,
  Siren,
  Plus,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  FileText,
  ClipboardCheck,
  Users,
} from 'lucide-react'
import { useCareStore } from '@/store/useCareStore'
import { contacts } from '@/data/mockData'
import type { ServiceType, AppointmentStatus, Appointment } from '@/types'

const serviceTypeConfig: Record<ServiceType, { label: string; icon: typeof Home; color: string; bg: string }> = {
  home_care: { label: '居家照护', icon: Home, color: 'text-care-500', bg: 'bg-care-100' },
  medical_assist: { label: '医疗协助', icon: Stethoscope, color: 'text-health-500', bg: 'bg-health-100' },
  housekeeping: { label: '家政服务', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-100' },
  accompany: { label: '陪护出行', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-100' },
  psychological: { label: '心理关怀', icon: Brain, color: 'text-pink-500', bg: 'bg-pink-100' },
  emergency: { label: '紧急救助', icon: Siren, color: 'text-danger-500', bg: 'bg-danger-100' },
}

const statusConfig: Record<AppointmentStatus, { label: string; badge: string; dot: string }> = {
  pending: { label: '待审核', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  family_pending: { label: '待家属确认', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  family_confirmed: { label: '家属已确认', badge: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
  completed: { label: '已完成', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  rejected: { label: '审核未通过', badge: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
  family_rejected: { label: '家属已拒绝', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-400' },
  cancelled: { label: '已取消', badge: 'bg-warm-200 text-warm-500', dot: 'bg-warm-400' },
}

const STEP_LABELS = ['提交申请', '审核通过', '家属确认', '服务完成'] as const

const stepStatusMap: Record<AppointmentStatus, number> = {
  pending: 0,
  family_pending: 1,
  family_confirmed: 2,
  completed: 3,
  rejected: 0,
  family_rejected: 1,
  cancelled: 1,
}

function StepIndicator({ status }: { status: AppointmentStatus }) {
  const reachedStep = stepStatusMap[status]
  const isOffPath = ['rejected', 'family_rejected', 'cancelled'].includes(status)

  if (isOffPath) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          {status === 'rejected' && (
            <>
              <span className="inline-block w-5 h-5 rounded-full bg-red-100 flex items-center justify-center"><XCircle size={12} className="text-red-500" /></span>
              <span className="text-red-600 font-medium">审核未通过，流程终止</span>
            </>
          )}
          {status === 'family_rejected' && (
            <>
              <span className="inline-block w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center"><XCircle size={12} className="text-rose-500" /></span>
              <span className="text-rose-600 font-medium">家属拒绝，流程终止</span>
            </>
          )}
          {status === 'cancelled' && (
            <>
              <span className="inline-block w-5 h-5 rounded-full bg-warm-200 flex items-center justify-center"><XCircle size={12} className="text-warm-500" /></span>
              <span className="text-warm-500 font-medium">预约已取消</span>
            </>
          )}
        </div>
      </div>
    )
  }

  const stepIcons = [ClipboardCheck, CheckCircle2, Users, CalendarCheck]

  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const Icon = stepIcons[i]
        const isCompleted = i < reachedStep
        const isCurrent = i === reachedStep
        const isFuture = i > reachedStep

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-care-500 text-white ring-2 ring-care-200'
                    : 'bg-warm-100 text-warm-300'
                }`}
              >
                <Icon size={14} />
              </div>
              <span
                className={`text-[10px] leading-tight whitespace-nowrap ${
                  isCompleted
                    ? 'text-emerald-600 font-medium'
                    : isCurrent
                    ? 'text-care-600 font-medium'
                    : 'text-warm-300'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 mb-4 transition-colors ${
                  isCompleted ? 'bg-emerald-400' : 'bg-warm-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

type FilterKey = 'all' | 'active' | 'family' | 'finished'

const filterTabs: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'family', label: '待确认' },
  { key: 'finished', label: '已结束' },
]

const serviceOptions: { value: ServiceType; label: string }[] = [
  { value: 'home_care', label: '居家照护' },
  { value: 'medical_assist', label: '医疗协助' },
  { value: 'housekeeping', label: '家政服务' },
  { value: 'accompany', label: '陪护出行' },
  { value: 'psychological', label: '心理关怀' },
  { value: 'emergency', label: '紧急救助' },
]

const initialForm = {
  serviceType: '' as ServiceType | '',
  appointmentDate: '',
  appointmentTime: '',
  address: '',
  applicantName: '',
  applicantPhone: '',
  familyContactId: '',
  notes: '',
}

export default function CommunityService() {
  const {
    appointments,
    approveAppointment,
    rejectAppointment,
    familyConfirmAppointment,
    familyRejectAppointment,
    completeAppointment,
    cancelAppointment,
    addAppointment,
  } = useCareStore()

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectModalId, setRejectModalId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectMode, setRejectMode] = useState<'reject' | 'family_reject'>('reject')
  const [confirmModalId, setConfirmModalId] = useState<string | null>(null)

  const filteredAppointments = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => {
      const dateA = `${a.appointmentDate}T${a.appointmentTime}`
      const dateB = `${b.appointmentDate}T${b.appointmentTime}`
      return dateB.localeCompare(dateA)
    })
    switch (activeFilter) {
      case 'active':
        return sorted.filter((a) => ['pending', 'family_pending', 'family_confirmed'].includes(a.status))
      case 'family':
        return sorted.filter((a) => a.status === 'family_pending')
      case 'finished':
        return sorted.filter((a) => ['completed', 'rejected', 'cancelled', 'family_rejected'].includes(a.status))
      default:
        return sorted
    }
  }, [appointments, activeFilter])

  const stats = useMemo(() => {
    const active = appointments.filter((a) =>
      ['pending', 'family_pending', 'family_confirmed'].includes(a.status)
    ).length
    const familyPending = appointments.filter((a) => a.status === 'family_pending').length
    const completed = appointments.filter((a) => a.status === 'completed').length
    return { active, familyPending, completed }
  }, [appointments])

  const handleSubmit = () => {
    if (!form.serviceType || !form.appointmentDate || !form.appointmentTime || !form.address || !form.applicantName || !form.applicantPhone || !form.familyContactId) return

    const serviceConfig = serviceTypeConfig[form.serviceType as ServiceType]
    const newAppointment: Appointment = {
      id: `apt${Date.now()}`,
      elderlyId: '1',
      serviceType: form.serviceType as ServiceType,
      title: serviceConfig.label + '服务',
      description: serviceConfig.label + '预约申请',
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      address: form.address,
      status: 'pending',
      applicantName: form.applicantName,
      applicantPhone: form.applicantPhone,
      familyContactId: form.familyContactId,
      familyConfirmed: false,
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(/\//g, '-'),
      notes: form.notes,
    }
    addAppointment(newAppointment)
    setForm(initialForm)
    setShowForm(false)
  }

  const openRejectModal = (id: string, mode: 'reject' | 'family_reject') => {
    setRejectModalId(id)
    setRejectMode(mode)
    setRejectReason('')
  }

  const handleRejectConfirm = () => {
    if (!rejectModalId || !rejectReason.trim()) return
    if (rejectMode === 'reject') {
      rejectAppointment(rejectModalId, rejectReason)
    } else {
      familyRejectAppointment(rejectModalId, rejectReason)
    }
    setRejectModalId(null)
    setRejectReason('')
  }

  const getContactName = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId)
    return contact ? `${contact.name}（${contact.relationship}）` : '未知'
  }

  const getNextActions = (appointment: Appointment) => {
    const actions: { label: string; onClick: () => void; variant: 'primary' | 'danger' | 'success' | 'warning' }[] = []
    switch (appointment.status) {
      case 'pending':
        actions.push(
          { label: '审核通过', onClick: () => approveAppointment(appointment.id), variant: 'success' },
          { label: '审核拒绝', onClick: () => openRejectModal(appointment.id, 'reject'), variant: 'danger' }
        )
        break
      case 'family_pending':
        actions.push(
          { label: '家属确认', onClick: () => setConfirmModalId(appointment.id), variant: 'success' },
          { label: '家属拒绝', onClick: () => openRejectModal(appointment.id, 'family_reject'), variant: 'danger' },
          { label: '取消预约', onClick: () => cancelAppointment(appointment.id), variant: 'warning' }
        )
        break
      case 'family_confirmed':
        actions.push(
          { label: '完成服务', onClick: () => completeAppointment(appointment.id), variant: 'success' },
          { label: '取消预约', onClick: () => cancelAppointment(appointment.id), variant: 'warning' }
        )
        break
    }
    return actions
  }

  const variantStyles = {
    primary: 'bg-care-500 hover:bg-care-600 text-white',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  }

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-6 animate-fade-in">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-warm-900">社区服务预约</h1>
            <p className="mt-1 text-sm text-warm-500">预约社区为老服务，家属协同确认</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-care-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-care-600 active:scale-95"
          >
            <Plus size={16} />
            新增预约
          </button>
        </header>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-care-200 animate-slide-up">
            <p className="text-xs text-warm-500 mb-1">进行中</p>
            <p className="text-2xl font-bold text-care-600">{stats.active}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-orange-200 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <p className="text-xs text-warm-500 mb-1">待家属确认</p>
            <p className="text-2xl font-bold text-orange-500">{stats.familyPending}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-emerald-200 animate-slide-up" style={{ animationDelay: '160ms' }}>
            <p className="text-xs text-warm-500 mb-1">已完成</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-1 rounded-full bg-warm-200/60 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeFilter === tab.key
                  ? 'bg-white text-warm-900 shadow-sm'
                  : 'text-warm-500 hover:text-warm-700'
              }`}
            >
              {tab.label}
              {tab.key === 'family' && stats.familyPending > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-4 h-4">
                  {stats.familyPending}
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm animate-fade-in">
            <CalendarCheck size={48} className="text-warm-300 mb-3" />
            <p className="text-warm-500 text-sm">暂无预约记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((apt, i) => {
              const svcCfg = serviceTypeConfig[apt.serviceType]
              const stCfg = statusConfig[apt.status]
              const SvcIcon = svcCfg.icon
              const isExpanded = expandedId === apt.id
              const nextActions = getNextActions(apt)
              const isTerminal = ['completed', 'rejected', 'cancelled', 'family_rejected'].includes(apt.status)

              return (
                <div
                  key={apt.id}
                  className={`rounded-xl bg-white shadow-sm border border-warm-200 overflow-hidden animate-slide-up ${
                    isTerminal ? 'opacity-75' : ''
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : apt.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${svcCfg.bg} ${svcCfg.color}`}>
                            <SvcIcon size={12} />
                            {svcCfg.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${stCfg.badge}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${stCfg.dot}`} />
                            {stCfg.label}
                          </span>
                        </div>
                        <p className="font-semibold text-warm-900 text-sm">{apt.title}</p>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-warm-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {apt.appointmentDate} {apt.appointmentTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {apt.address}
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
                      <div className="mb-3 px-1">
                        <StepIndicator status={apt.status} />
                      </div>

                      <div className="space-y-2.5 text-sm">
                        <div className="flex gap-2">
                          <span className="text-warm-400 w-20 shrink-0">服务描述</span>
                          <span className="text-warm-700">{apt.description}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-warm-400 w-20 shrink-0">申请人</span>
                          <span className="text-warm-700">{apt.applicantName}（{apt.applicantPhone}）</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-warm-400 w-20 shrink-0">家属联系人</span>
                          <span className="text-warm-700">{getContactName(apt.familyContactId)}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-warm-400 w-20 shrink-0">家属确认</span>
                          <span className={apt.familyConfirmed ? 'text-emerald-600' : 'text-warm-400'}>
                            {apt.familyConfirmed ? (
                              <span className="flex items-center gap-1"><CheckCircle2 size={14} />已确认{apt.familyConfirmTime ? `（${apt.familyConfirmTime}）` : ''}</span>
                            ) : (
                              <span className="flex items-center gap-1"><AlertCircle size={14} />待确认</span>
                            )}
                          </span>
                        </div>
                        {apt.notes && (
                          <div className="flex gap-2">
                            <span className="text-warm-400 w-20 shrink-0">备注</span>
                            <span className="text-warm-700">{apt.notes}</span>
                          </div>
                        )}
                        {apt.rejectReason && (
                          <div className="flex gap-2">
                            <span className="text-warm-400 w-20 shrink-0">拒绝原因</span>
                            <span className="text-red-600">{apt.rejectReason}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <span className="text-warm-400 w-20 shrink-0">创建时间</span>
                          <span className="text-warm-500 text-xs">{apt.createdAt}</span>
                        </div>
                      </div>

                      {nextActions.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {nextActions.map((action) => (
                            <button
                              key={action.label}
                              onClick={(e) => {
                                e.stopPropagation()
                                action.onClick()
                              }}
                              className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors active:scale-95 ${variantStyles[action.variant]}`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {apt.status === 'family_pending' && (
                        <div className="mt-3 rounded-lg bg-orange-50 border border-orange-200 p-3">
                          <div className="flex items-center gap-2 text-sm text-orange-700 mb-1">
                            <UserCheck size={16} />
                            <span className="font-medium">等待家属确认</span>
                          </div>
                          <p className="text-xs text-orange-600">
                            已通知家属联系人 {getContactName(apt.familyContactId)}，请等待其确认或在此模拟家属操作。
                          </p>
                        </div>
                      )}

                      {isTerminal && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-warm-400">
                          {apt.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-400" />}
                          {apt.status === 'rejected' && <XCircle size={14} className="text-red-400" />}
                          {apt.status === 'cancelled' && <XCircle size={14} className="text-warm-400" />}
                          {apt.status === 'family_rejected' && <XCircle size={14} className="text-rose-400" />}
                          <span>此预约已结束</span>
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setShowForm(false)}>
          <div
            className="w-full max-w-lg mx-4 rounded-2xl bg-white shadow-xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
              <h2 className="text-lg font-semibold text-warm-900 flex items-center gap-2">
                <FileText size={20} className="text-care-500" />
                新增服务预约
              </h2>
              <button onClick={() => setShowForm(false)} className="text-warm-400 hover:text-warm-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">服务类型 <span className="text-danger-500">*</span></label>
                <select
                  value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value as ServiceType })}
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                >
                  <option value="">请选择服务类型</option>
                  {serviceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">预约日期 <span className="text-danger-500">*</span></label>
                  <input
                    type="date"
                    value={form.appointmentDate}
                    onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">预约时间 <span className="text-danger-500">*</span></label>
                  <input
                    type="time"
                    value={form.appointmentTime}
                    onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">服务地址 <span className="text-danger-500">*</span></label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="请输入服务地址"
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">申请人 <span className="text-danger-500">*</span></label>
                  <input
                    type="text"
                    value={form.applicantName}
                    onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
                    placeholder="申请人姓名"
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">联系电话 <span className="text-danger-500">*</span></label>
                  <input
                    type="tel"
                    value={form.applicantPhone}
                    onChange={(e) => setForm({ ...form, applicantPhone: e.target.value })}
                    placeholder="联系电话"
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">家属联系人 <span className="text-danger-500">*</span></label>
                <select
                  value={form.familyContactId}
                  onChange={(e) => setForm({ ...form, familyContactId: e.target.value })}
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                >
                  <option value="">请选择家属联系人</option>
                  {contacts.filter((c) => c.elderlyId === '1').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}（{c.relationship}）{c.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">备注</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="请输入备注信息"
                  rows={3}
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-warm-300 px-5 py-2.5 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.serviceType || !form.appointmentDate || !form.appointmentTime || !form.address || !form.applicantName || !form.applicantPhone || !form.familyContactId}
                className="rounded-lg bg-care-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-care-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交预约
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setRejectModalId(null)}>
          <div
            className="w-full max-w-sm mx-4 rounded-2xl bg-white shadow-xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
              <h2 className="text-base font-semibold text-warm-900 flex items-center gap-2">
                <XCircle size={18} className="text-red-500" />
                {rejectMode === 'reject' ? '审核拒绝' : '家属拒绝'}
              </h2>
              <button onClick={() => setRejectModalId(null)} className="text-warm-400 hover:text-warm-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-warm-700 mb-1.5">拒绝原因 <span className="text-danger-500">*</span></label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因"
                rows={3}
                className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => setRejectModalId(null)}
                className="rounded-lg border border-warm-300 px-5 py-2.5 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setConfirmModalId(null)}>
          <div
            className="w-full max-w-sm mx-4 rounded-2xl bg-white shadow-xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 text-center">
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <UserCheck size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-base font-semibold text-warm-900 mb-2">家属确认预约</h2>
              <p className="text-sm text-warm-500">
                确认将代表家属联系人同意此次社区服务预约，确认后服务将进入执行阶段。
              </p>
            </div>
            <div className="px-6 py-4 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModalId(null)}
                className="rounded-lg border border-warm-300 px-5 py-2.5 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  familyConfirmAppointment(confirmModalId)
                  setConfirmModalId(null)
                }}
                className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 active:scale-95"
              >
                确认同意
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
