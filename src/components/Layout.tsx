import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  HeartPulse,
  Pill,
  AlertTriangle,
  Users,
  ShieldCheck,
  CalendarCheck,
  FileText,
  ShieldAlert,
  CalendarDays,
  Handshake,
} from 'lucide-react'
import { useCareStore } from '@/store/useCareStore'
import { healthRecords } from '@/data/mockData'
import { assessRisk, getRiskLevelConfig } from '@/lib/riskEngine'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '首页概览' },
  { to: '/risk-stratification', icon: ShieldAlert, label: '风险分层' },
  { to: '/health', icon: HeartPulse, label: '健康记录' },
  { to: '/medication', icon: Pill, label: '用药提醒' },
  { to: '/alerts', icon: AlertTriangle, label: '异常告警' },
  { to: '/schedule', icon: CalendarDays, label: '照护排班' },
  { to: '/family-care-task', icon: Handshake, label: '家庭协同' },
  { to: '/community-service', icon: CalendarCheck, label: '社区服务' },
  { to: '/monthly-report', icon: FileText, label: '月度报告' },
  { to: '/contacts', icon: Users, label: '家属联系人' },
]

export default function Layout() {
  const unresolvedAlerts = useCareStore(
    (s) => s.alerts.filter((a) => !a.resolved).length
  )
  const pendingFamilyConfirm = useCareStore(
    (s) => s.appointments.filter((a) => a.status === 'family_pending').length
  )
  const overdueTasks = useCareStore(
    (s) => s.careTasks.filter((t) => t.status === 'overdue').length
  )
  const activeReminders = useCareStore(
    (s) => s.taskReminders.filter((r) => r.status === 'active').length
  )
  const riskState = useCareStore((s) => {
    const assessment = assessRisk('1', healthRecords, s.alerts, s.medications)
    return { level: assessment.overallRisk, score: assessment.totalScore }
  })
  const riskCfg = getRiskLevelConfig(riskState.level)

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 flex-shrink-0 bg-warm-800 text-warm-100 flex flex-col">
        <div className="px-6 py-5 flex items-center gap-3 border-b border-warm-700">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-care-400 to-care-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white leading-tight">远程关怀</h1>
            <p className="text-xs text-warm-400">独居老人照护面板</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-care-500/20 text-care-300 font-medium'
                    : 'text-warm-400 hover:text-warm-100 hover:bg-warm-700/50'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{item.label}</span>
              {item.to === '/alerts' && unresolvedAlerts > 0 && (
                <span className="ml-auto bg-danger-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {unresolvedAlerts}
                </span>
              )}
              {item.to === '/community-service' && pendingFamilyConfirm > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {pendingFamilyConfirm}
                </span>
              )}
              {item.to === '/schedule' && overdueTasks > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {overdueTasks}
                </span>
              )}
              {item.to === '/family-care-task' && activeReminders > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {activeReminders}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mx-3 mb-4 rounded-xl bg-gradient-to-br from-care-500/10 to-health-500/10 border border-warm-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-care-500/20 flex items-center justify-center text-care-400 text-xs font-semibold">
              张
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-warm-100 font-medium leading-tight">张秀兰</p>
              <p className="text-xs text-warm-500">78岁 · 女</p>
            </div>
            <NavLink
              to="/risk-stratification"
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskCfg.bg} ${riskCfg.color}`}
            >
              {riskCfg.label}
            </NavLink>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
