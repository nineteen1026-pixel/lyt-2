import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, AlertCircle, Info, ShieldCheck, CheckCircle2, Filter, ArrowRight } from 'lucide-react'
import { useCareStore } from '@/store/useCareStore'
import { healthRecords } from '@/data/mockData'
import { assessRisk, getRiskLevelConfig } from '@/lib/riskEngine'
import type { AlertLevel } from '@/types'

const levelConfig: Record<AlertLevel, { label: string; icon: typeof AlertTriangle; badge: string; border: string; iconColor: string }> = {
  urgent: { label: '紧急', icon: AlertTriangle, badge: 'bg-danger-100 text-danger-600', border: 'border-l-danger-500', iconColor: 'text-danger-500' },
  warning: { label: '警告', icon: AlertCircle, badge: 'bg-care-100 text-care-700', border: 'border-l-care-500', iconColor: 'text-care-500' },
  info: { label: '提示', icon: Info, badge: 'bg-info-100 text-info-500', border: 'border-l-info-400', iconColor: 'text-info-400' },
}

const filterTabs: { key: AlertLevel | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'urgent', label: '紧急' },
  { key: 'warning', label: '警告' },
  { key: 'info', label: '提示' },
]

export default function Alerts() {
  const { alerts, medications, resolveAlert } = useCareStore()
  const [activeTab, setActiveTab] = useState<AlertLevel | 'all'>('all')
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false)

  const riskAssessment = useMemo(
    () => assessRisk('1', healthRecords, alerts, medications),
    [alerts, medications]
  )
  const riskCfg = getRiskLevelConfig(riskAssessment.overallRisk)

  const unresolved = useMemo(() => alerts.filter((a) => !a.resolved), [alerts])
  const urgentUnresolved = useMemo(() => unresolved.filter((a) => a.level === 'urgent'), [unresolved])
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayAlerts = useMemo(() => alerts.filter((a) => a.time.startsWith(todayStr)), [alerts, todayStr])

  const activeAlerts = useMemo(() => {
    let list = unresolved
    if (activeTab !== 'all') list = list.filter((a) => a.level === activeTab)
    return list
  }, [unresolved, activeTab])

  const resolvedAlerts = useMemo(() => {
    let list = alerts.filter((a) => a.resolved)
    if (showUnresolvedOnly) return []
    if (activeTab !== 'all') list = list.filter((a) => a.level === activeTab)
    return list
  }, [alerts, activeTab, showUnresolvedOnly])

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-6 animate-fade-in">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-warm-900">异常告警</h1>
          <p className="mt-1 text-sm text-warm-500">实时监控老人安全与健康异常</p>
        </header>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-care-200 animate-slide-up">
            <p className="text-xs text-warm-500 mb-1">未处理告警</p>
            <p className="text-2xl font-bold text-care-600">{unresolved.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-danger-200 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <p className="text-xs text-warm-500 mb-1">紧急告警</p>
            <p className="text-2xl font-bold text-danger-500">{urgentUnresolved.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-info-200 animate-slide-up" style={{ animationDelay: '160ms' }}>
            <p className="text-xs text-warm-500 mb-1">今日告警</p>
            <p className="text-2xl font-bold text-info-500">{todayAlerts.length}</p>
          </div>
        </div>

        <Link
          to="/risk-stratification"
          className={`mb-6 flex items-center gap-4 rounded-xl p-4 shadow-sm border-2 transition-all hover:shadow-md animate-slide-up ${
            riskAssessment.overallRisk === 'low' ? 'bg-health-50 border-health-200' :
            riskAssessment.overallRisk === 'medium' ? 'bg-care-50 border-care-200' : 'bg-danger-50 border-danger-200'
          }`}
          style={{ animationDelay: '200ms' }}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${riskCfg.bg}`}>
            <ShieldCheck className={`w-5 h-5 ${riskCfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-warm-800">当前风险等级</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${riskCfg.bg} ${riskCfg.color}`}>
                {riskCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-warm-500">家属提醒：</span>
              <div className="flex items-center gap-1">
                {riskAssessment.notificationStrategy.channels.slice(0, 3).map((ch) => (
                  <span key={ch} className="text-[10px] text-warm-400 bg-warm-100 rounded px-1.5 py-0.5">
                    {ch}
                  </span>
                ))}
              </div>
              <span className="text-xs text-warm-500">· {riskAssessment.notificationStrategy.frequency}</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-warm-300 shrink-0" />
        </Link>

        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex gap-1 rounded-full bg-warm-200/60 p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-warm-900 shadow-sm'
                    : 'text-warm-500 hover:text-warm-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowUnresolvedOnly((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              showUnresolvedOnly
                ? 'bg-care-500 text-white'
                : 'bg-warm-200/60 text-warm-500 hover:text-warm-700'
            }`}
          >
            <Filter size={14} />
            只看未处理
          </button>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-warm-800">
            <AlertTriangle size={18} className="text-care-500" />
            待处理告警
          </h2>

          {activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm animate-fade-in">
              <ShieldCheck size={48} className="text-health-400 mb-3" />
              <p className="text-warm-500 text-sm">当前无待处理告警</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert, i) => {
                const cfg = levelConfig[alert.level]
                const Icon = cfg.icon
                return (
                  <div
                    key={alert.id}
                    className={`rounded-xl bg-white shadow-sm border-l-[3px] ${cfg.border} p-4 animate-slide-up`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
                            <Icon size={12} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="font-semibold text-warm-900 text-sm">{alert.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-warm-500">{alert.description}</p>
                        <p className="mt-2 text-xs text-warm-400">{alert.time}</p>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="shrink-0 self-center rounded-lg bg-care-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-care-600 active:scale-95"
                      >
                        处理
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {!showUnresolvedOnly && resolvedAlerts.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-warm-800">
              <CheckCircle2 size={18} className="text-health-500" />
              告警历史
            </h2>
            <div className="space-y-3">
              {resolvedAlerts.map((alert, i) => {
                return (
                  <div
                    key={alert.id}
                    className="rounded-xl bg-white/70 shadow-sm border border-warm-200 border-l-[3px] border-l-warm-300 p-4 opacity-70 animate-slide-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-health-100 px-2 py-0.5 text-xs font-medium text-health-600">
                            <CheckCircle2 size={12} />
                            已处理
                          </span>
                        </div>
                        <p className="font-semibold text-warm-700 text-sm">{alert.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-warm-400">{alert.description}</p>
                        <p className="mt-2 text-xs text-warm-300">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
