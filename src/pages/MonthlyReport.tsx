import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import {
  FileText,
  Activity,
  Pill,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { healthRecords } from '@/data/mockData'
import { useCareStore } from '@/store/useCareStore'
import type { HealthMetricType, ServiceType } from '@/types'

const METRIC_LABELS: Record<HealthMetricType, string> = {
  bloodPressure: '血压',
  heartRate: '心率',
  bloodSugar: '血糖',
  temperature: '体温',
}

const METRIC_UNITS: Record<HealthMetricType, string> = {
  bloodPressure: 'mmHg',
  heartRate: 'bpm',
  bloodSugar: 'mmol/L',
  temperature: '°C',
}

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  home_care: '居家照护',
  medical_assist: '医疗协助',
  housekeeping: '家政服务',
  accompany: '陪护出行',
  psychological: '心理关怀',
  emergency: '紧急救助',
}

const PIE_COLORS = ['#22C55E', '#EF4444', '#A8A29E']

function getMonthRange(offset: number) {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() - offset, 1)
  const year = target.getFullYear()
  const month = target.getMonth()
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDay = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
  const label = `${year}年${month + 1}月`
  return { start, end, label }
}

function computeHealthSummary(records: typeof healthRecords, start: string, end: string) {
  const filtered = records.filter((r) => r.date >= start && r.date <= end)
  const metrics: {
    type: HealthMetricType
    label: string
    avg: string
    min: string
    max: string
    trend: 'up' | 'down' | 'stable'
    unit: string
  }[] = []

  const types: HealthMetricType[] = ['bloodPressure', 'heartRate', 'bloodSugar', 'temperature']

  for (const type of types) {
    const typeRecords = filtered.filter((r) => r.type === type)
    if (typeRecords.length === 0) continue

    if (type === 'bloodPressure') {
      const systolics = typeRecords.map((r) => r.systolic ?? 0)
      const diastolics = typeRecords.map((r) => r.diastolic ?? 0)
      const avgSys = Math.round(systolics.reduce((a, b) => a + b, 0) / systolics.length)
      const avgDia = Math.round(diastolics.reduce((a, b) => a + b, 0) / diastolics.length)
      const mid = Math.floor(typeRecords.length / 2)
      const firstHalfSys = systolics.slice(0, mid)
      const secondHalfSys = systolics.slice(mid)
      const avgFirst = firstHalfSys.reduce((a, b) => a + b, 0) / firstHalfSys.length
      const avgSecond = secondHalfSys.reduce((a, b) => a + b, 0) / secondHalfSys.length
      const diff = avgSecond - avgFirst
      metrics.push({
        type,
        label: METRIC_LABELS[type],
        avg: `${avgSys}/${avgDia}`,
        min: `${Math.min(...systolics)}/${Math.min(...diastolics)}`,
        max: `${Math.max(...systolics)}/${Math.max(...diastolics)}`,
        trend: diff > 3 ? 'up' : diff < -3 ? 'down' : 'stable',
        unit: METRIC_UNITS[type],
      })
    } else {
      const values = typeRecords.map((r) => r.value)
      const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      const mid = Math.floor(values.length / 2)
      const firstHalf = values.slice(0, mid)
      const secondHalf = values.slice(mid)
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      const diff = avgSecond - avgFirst
      metrics.push({
        type,
        label: METRIC_LABELS[type],
        avg,
        min: Math.min(...values).toFixed(1),
        max: Math.max(...values).toFixed(1),
        trend: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable',
        unit: METRIC_UNITS[type],
      })
    }
  }

  return metrics
}

function computeMedicationSummary(medications: ReturnType<typeof useCareStore.getState>['medications']) {
  const taken = medications.filter((m) => m.status === 'taken').length
  const pending = medications.filter((m) => m.status === 'pending').length
  const missed = medications.filter((m) => m.status === 'missed').length
  const total = medications.length
  const rate = total > 0 ? Math.round((taken / total) * 100) : 0
  return { taken, pending, missed, total, rate }
}

function computeServiceSummary(appointments: ReturnType<typeof useCareStore.getState>['appointments'], start: string, end: string) {
  const filtered = appointments.filter((a) => a.appointmentDate >= start && a.appointmentDate <= end)
  const completed = filtered.filter((a) => a.status === 'completed').length
  const active = filtered.filter((a) => ['pending', 'family_pending', 'family_confirmed'].includes(a.status)).length
  const cancelled = filtered.filter((a) => ['rejected', 'cancelled', 'family_rejected'].includes(a.status)).length
  const total = filtered.length

  const byType: Record<string, { total: number; completed: number }> = {}
  for (const apt of filtered) {
    if (!byType[apt.serviceType]) {
      byType[apt.serviceType] = { total: 0, completed: 0 }
    }
    byType[apt.serviceType].total++
    if (apt.status === 'completed') {
      byType[apt.serviceType].completed++
    }
  }

  return { completed, active, cancelled, total, byType }
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-danger-500" />
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-info-500" />
  return <Minus className="w-4 h-4 text-warm-400" />
}

export default function MonthlyReport() {
  const [monthOffset, setMonthOffset] = useState(0)
  const medications = useCareStore((s) => s.medications)
  const appointments = useCareStore((s) => s.appointments)

  const { start, end, label } = useMemo(() => getMonthRange(monthOffset), [monthOffset])
  const healthSummary = useMemo(() => computeHealthSummary(healthRecords, start, end), [start, end])
  const medSummary = useMemo(() => computeMedicationSummary(medications), [medications])
  const svcSummary = useMemo(() => computeServiceSummary(appointments, start, end), [appointments, start, end])

  const healthTrendData = useMemo(() => {
    const days: { date: string; bloodPressureSys: number; bloodPressureDia: number; heartRate: number; bloodSugar: number; temperature: number }[] = []
    const filtered = healthRecords.filter((r) => r.date >= start && r.date <= end)
    const dateSet = [...new Set(filtered.map((r) => r.date))].sort()

    for (const date of dateSet) {
      const dayRecords = filtered.filter((r) => r.date === date)
      const bp = dayRecords.find((r) => r.type === 'bloodPressure')
      const hr = dayRecords.find((r) => r.type === 'heartRate')
      const bs = dayRecords.find((r) => r.type === 'bloodSugar')
      const tp = dayRecords.find((r) => r.type === 'temperature')
      const [, m, d] = date.split('-')
      days.push({
        date: `${m}/${d}`,
        bloodPressureSys: bp?.systolic ?? 0,
        bloodPressureDia: bp?.diastolic ?? 0,
        heartRate: hr?.value ?? 0,
        bloodSugar: bs?.value ?? 0,
        temperature: tp?.value ?? 0,
      })
    }
    return days
  }, [start, end])

  const medPieData = useMemo(() => [
    { name: '已服药', value: medSummary.taken },
    { name: '漏服', value: medSummary.missed },
    { name: '待服', value: medSummary.pending },
  ], [medSummary])

  const serviceBarData = useMemo(() => {
    return Object.entries(svcSummary.byType).map(([type, data]) => ({
      name: SERVICE_TYPE_LABELS[type as ServiceType] ?? type,
      总计: data.total,
      已完成: data.completed,
    }))
  }, [svcSummary.byType])

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-6 pb-24 animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-warm-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-care-500" />
              月度关怀报告
            </h1>
            <p className="text-sm text-warm-500 mt-1">汇总健康趋势、用药记录和服务完成情况</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonthOffset((prev) => prev + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-warm-200 flex items-center justify-center text-warm-500 hover:bg-warm-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-warm-800 min-w-[90px] text-center">{label}</span>
            <button
              onClick={() => setMonthOffset((prev) => Math.max(0, prev - 1))}
              disabled={monthOffset === 0}
              className="w-8 h-8 rounded-lg bg-white border border-warm-200 flex items-center justify-center text-warm-500 hover:bg-warm-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        <section className="animate-slide-up">
          <h2 className="text-lg font-semibold text-warm-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-care-500" />
            健康趋势
          </h2>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {healthSummary.map((m) => (
              <div key={m.type} className="bg-white rounded-xl p-4 shadow-sm border border-warm-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-warm-700">{m.label}</span>
                  <TrendIcon trend={m.trend} />
                </div>
                <p className="text-2xl font-bold text-warm-900">{m.avg}</p>
                <p className="text-xs text-warm-400 mt-1">{m.unit}</p>
                <div className="mt-2 pt-2 border-t border-warm-100 flex justify-between text-xs text-warm-500">
                  <span>最低 {m.min}</span>
                  <span>最高 {m.max}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-warm-700 mb-4">血压趋势（收缩压/舒张压）</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={healthTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportSys" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="reportDia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={{ stroke: '#E7E5E4' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={{ stroke: '#E7E5E4' }} domain={[60, 160]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }} />
                <Legend verticalAlign="top" height={36} iconType="circle" formatter={(v: string) => <span className="text-xs text-warm-700">{v}</span>} />
                <Area type="monotone" dataKey="bloodPressureSys" name="收缩压" stroke="#F97316" strokeWidth={2} fill="url(#reportSys)" dot={false} />
                <Area type="monotone" dataKey="bloodPressureDia" name="舒张压" stroke="#4ADE80" strokeWidth={2} fill="url(#reportDia)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h2 className="text-lg font-semibold text-warm-800 mb-4 flex items-center gap-2">
            <Pill className="w-5 h-5 text-care-500" />
            用药记录
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-warm-100 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-warm-700 mb-4 self-start">用药依从性</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={medPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {medPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }} />
                  <Legend verticalAlign="bottom" height={36} formatter={(v: string) => <span className="text-xs text-warm-700">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center">
                <p className="text-3xl font-bold text-warm-900">{medSummary.rate}%</p>
                <p className="text-xs text-warm-400 mt-0.5">服药依从率</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-warm-100">
              <h3 className="text-sm font-semibold text-warm-700 mb-4">用药统计</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-health-50 border border-health-100">
                  <CheckCircle2 className="w-6 h-6 text-health-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-warm-600">已服药</p>
                    <p className="text-lg font-bold text-warm-900">{medSummary.taken} 次</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-danger-50 border border-danger-100">
                  <XCircle className="w-6 h-6 text-danger-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-warm-600">漏服</p>
                    <p className="text-lg font-bold text-warm-900">{medSummary.missed} 次</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-warm-100 border border-warm-200">
                  <Clock className="w-6 h-6 text-warm-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-warm-600">待服</p>
                    <p className="text-lg font-bold text-warm-900">{medSummary.pending} 次</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-warm-100">
                <div className="flex justify-between text-sm">
                  <span className="text-warm-500">总计用药记录</span>
                  <span className="font-semibold text-warm-800">{medSummary.total} 次</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold text-warm-800 mb-4 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-care-500" />
            服务完成情况
          </h2>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-warm-100 text-center">
              <p className="text-xs text-warm-500 mb-1">总服务</p>
              <p className="text-2xl font-bold text-warm-900">{svcSummary.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200 text-center">
              <p className="text-xs text-warm-500 mb-1">已完成</p>
              <p className="text-2xl font-bold text-emerald-600">{svcSummary.completed}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-care-200 text-center">
              <p className="text-xs text-warm-500 mb-1">进行中</p>
              <p className="text-2xl font-bold text-care-600">{svcSummary.active}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-warm-200 text-center">
              <p className="text-xs text-warm-500 mb-1">已取消/拒绝</p>
              <p className="text-2xl font-bold text-warm-500">{svcSummary.cancelled}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-warm-700 mb-4">各服务类型完成情况</h3>
            {serviceBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={serviceBarData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={{ stroke: '#E7E5E4' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={{ stroke: '#E7E5E4' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" formatter={(v: string) => <span className="text-xs text-warm-700">{v}</span>} />
                  <Bar dataKey="总计" fill="#FB923C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="已完成" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <CalendarCheck className="w-10 h-10 text-warm-300 mb-2" />
                <p className="text-sm text-warm-400">该月暂无服务记录</p>
              </div>
            )}
          </div>

          {svcSummary.total > 0 && (
            <div className="mt-4 bg-gradient-to-br from-care-50 to-health-50 rounded-2xl p-5 border border-care-200">
              <h3 className="text-sm font-semibold text-warm-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-care-500" />
                月度总结
              </h3>
              <div className="space-y-2 text-sm text-warm-700">
                <p>
                  本月共安排 <span className="font-semibold text-warm-900">{svcSummary.total}</span> 项社区服务，
                  已完成 <span className="font-semibold text-emerald-600">{svcSummary.completed}</span> 项，
                  {svcSummary.active > 0 ? (
                    <>进行中 <span className="font-semibold text-care-600">{svcSummary.active}</span> 项，</>
                  ) : null}
                  {svcSummary.cancelled > 0 ? (
                    <>取消/拒绝 <span className="font-semibold text-warm-500">{svcSummary.cancelled}</span> 项。</>
                  ) : null}
                  {svcSummary.cancelled === 0 && svcSummary.active === 0 && '全部完成。'}
                </p>
                <p>
                  服药依从率为 <span className="font-semibold text-warm-900">{medSummary.rate}%</span>，
                  {medSummary.rate >= 80 ? (
                    <span className="text-health-600 font-medium">用药情况良好。</span>
                  ) : medSummary.rate >= 50 ? (
                    <span className="text-care-600 font-medium">用药情况需关注。</span>
                  ) : (
                    <span className="text-danger-600 font-medium">用药情况需重点关注，建议加强提醒。</span>
                  )}
                </p>
                {healthSummary.some((m) => m.trend === 'up') && (
                  <p>
                    健康指标中，{healthSummary.filter((m) => m.trend === 'up').map((m) => m.label).join('、')}
                    <span className="text-danger-600 font-medium"> 呈上升趋势</span>，建议密切关注。
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
