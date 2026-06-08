import type { Elderly, HealthRecord, Medication, Alert, Contact } from '@/types'

export const elderly: Elderly = {
  id: '1',
  name: '张秀兰',
  age: 78,
  gender: '女',
  status: 'warning',
  avatar: '',
}

function generateHealthRecords(): HealthRecord[] {
  const records: HealthRecord[] = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    records.push({
      id: `bp-${i}`,
      elderlyId: '1',
      type: 'bloodPressure',
      value: 0,
      systolic: Math.round(130 + Math.random() * 20 - 5),
      diastolic: Math.round(80 + Math.random() * 12 - 4),
      unit: 'mmHg',
      date: dateStr,
      time: '08:00',
    })

    records.push({
      id: `hr-${i}`,
      elderlyId: '1',
      type: 'heartRate',
      value: Math.round(68 + Math.random() * 16 - 6),
      unit: 'bpm',
      date: dateStr,
      time: '08:00',
    })

    records.push({
      id: `bs-${i}`,
      elderlyId: '1',
      type: 'bloodSugar',
      value: parseFloat((5.2 + Math.random() * 1.8 - 0.6).toFixed(1)),
      unit: 'mmol/L',
      date: dateStr,
      time: '07:30',
    })

    records.push({
      id: `tp-${i}`,
      elderlyId: '1',
      type: 'temperature',
      value: parseFloat((36.3 + Math.random() * 0.8).toFixed(1)),
      unit: '°C',
      date: dateStr,
      time: '08:00',
    })
  }

  return records
}

export const healthRecords: HealthRecord[] = generateHealthRecords()

export const medications: Medication[] = [
  {
    id: 'm1',
    elderlyId: '1',
    name: '硝苯地平缓释片',
    dosage: '30mg',
    frequency: '每日1次',
    scheduledTime: '08:00',
    status: 'taken',
    notes: '饭后服用',
  },
  {
    id: 'm2',
    elderlyId: '1',
    name: '二甲双胍',
    dosage: '500mg',
    frequency: '每日2次',
    scheduledTime: '08:00',
    status: 'taken',
    notes: '随餐服用',
  },
  {
    id: 'm3',
    elderlyId: '1',
    name: '阿司匹林肠溶片',
    dosage: '100mg',
    frequency: '每日1次',
    scheduledTime: '12:00',
    status: 'pending',
    notes: '午饭后服用',
  },
  {
    id: 'm4',
    elderlyId: '1',
    name: '二甲双胍',
    dosage: '500mg',
    frequency: '每日2次',
    scheduledTime: '18:00',
    status: 'pending',
    notes: '随餐服用',
  },
  {
    id: 'm5',
    elderlyId: '1',
    name: '辛伐他汀',
    dosage: '20mg',
    frequency: '每日1次',
    scheduledTime: '21:00',
    status: 'pending',
    notes: '睡前服用',
  },
  {
    id: 'm6',
    elderlyId: '1',
    name: '钙尔奇D',
    dosage: '600mg',
    frequency: '每日1次',
    scheduledTime: '21:00',
    status: 'pending',
    notes: '睡前与辛伐他汀间隔30分钟',
  },
]

export const alerts: Alert[] = [
  {
    id: 'a1',
    elderlyId: '1',
    level: 'urgent',
    title: '血压异常升高',
    description: '今日上午8点测得收缩压155mmHg，超出正常范围（90-140mmHg），建议及时关注并联系医生。',
    time: '2026-06-08 08:05',
    resolved: false,
  },
  {
    id: 'a2',
    elderlyId: '1',
    level: 'warning',
    title: '心率偏快',
    description: '今日静息心率82bpm，高于近7日平均值72bpm，持续观察中。',
    time: '2026-06-08 08:05',
    resolved: false,
  },
  {
    id: 'a3',
    elderlyId: '1',
    level: 'info',
    title: '午间用药提醒',
    description: '阿司匹林肠溶片（100mg）将于12:00需要服用，请提前准备。',
    time: '2026-06-08 11:30',
    resolved: false,
  },
  {
    id: 'a4',
    elderlyId: '1',
    level: 'warning',
    title: '昨日漏服药物',
    description: '昨日21:00辛伐他汀未按时服用，请确认老人情况。',
    time: '2026-06-07 22:00',
    resolved: true,
  },
  {
    id: 'a5',
    elderlyId: '1',
    level: 'info',
    title: '血糖轻微波动',
    description: '近3天空腹血糖在5.8-6.2mmol/L之间波动，略高于理想范围，建议关注饮食。',
    time: '2026-06-07 09:00',
    resolved: true,
  },
  {
    id: 'a6',
    elderlyId: '1',
    level: 'urgent',
    title: '跌倒检测告警',
    description: '检测到可能的跌倒事件，已自动发送位置信息给紧急联系人。',
    time: '2026-06-05 15:23',
    resolved: true,
  },
  {
    id: 'a7',
    elderlyId: '1',
    level: 'warning',
    title: '体温偏高',
    description: '今日体温37.1°C，略高于正常范围，建议持续观察。',
    time: '2026-06-04 14:30',
    resolved: true,
  },
]

export const contacts: Contact[] = [
  {
    id: 'c1',
    elderlyId: '1',
    name: '张建国',
    relationship: '儿子',
    phone: '138-0000-1234',
    isEmergency: true,
    avatar: '',
  },
  {
    id: 'c2',
    elderlyId: '1',
    name: '张美华',
    relationship: '女儿',
    phone: '139-0000-5678',
    isEmergency: true,
    avatar: '',
  },
  {
    id: 'c3',
    elderlyId: '1',
    name: '李明',
    relationship: '女婿',
    phone: '136-0000-9012',
    isEmergency: false,
    avatar: '',
  },
  {
    id: 'c4',
    elderlyId: '1',
    name: '王芳',
    relationship: '儿媳',
    phone: '137-0000-3456',
    isEmergency: false,
    avatar: '',
  },
  {
    id: 'c5',
    elderlyId: '1',
    name: '张小明',
    relationship: '孙子',
    phone: '135-0000-7890',
    isEmergency: false,
    avatar: '',
  },
  {
    id: 'c6',
    elderlyId: '1',
    name: '陈医生',
    relationship: '家庭医生',
    phone: '133-0000-2345',
    isEmergency: true,
    avatar: '',
  },
]
