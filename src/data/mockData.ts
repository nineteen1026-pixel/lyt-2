import type { Elderly, HealthRecord, Medication, Alert, Contact, Appointment, CareTask, TodoItem } from '@/types'

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

  for (let i = 59; i >= 0; i--) {
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

function generateMedications(): Medication[] {
  const records: Medication[] = []
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const prescriptions = [
    { name: '硝苯地平缓释片', dosage: '30mg', frequency: '每日1次', time: '08:00', notes: '饭后服用' },
    { name: '二甲双胍', dosage: '500mg', frequency: '每日2次', time: '08:00', notes: '随餐服用' },
    { name: '阿司匹林肠溶片', dosage: '100mg', frequency: '每日1次', time: '12:00', notes: '午饭后服用' },
    { name: '二甲双胍', dosage: '500mg', frequency: '每日2次', time: '18:00', notes: '随餐服用' },
    { name: '辛伐他汀', dosage: '20mg', frequency: '每日1次', time: '21:00', notes: '睡前服用' },
    { name: '钙尔奇D', dosage: '600mg', frequency: '每日1次', time: '21:00', notes: '睡前与辛伐他汀间隔30分钟' },
  ]

  let idCounter = 0

  for (let i = 59; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    for (const rx of prescriptions) {
      let status: Medication['status']
      if (dateStr < todayStr) {
        const rand = Math.random()
        if (rand < 0.82) status = 'taken'
        else if (rand < 0.92) status = 'missed'
        else status = 'taken'
      } else {
        const [h, min] = rx.time.split(':').map(Number)
        const scheduledMinutes = h * 60 + min
        const nowMinutes = now.getHours() * 60 + now.getMinutes()

        if (nowMinutes >= scheduledMinutes + 30) {
          status = Math.random() < 0.85 ? 'taken' : 'missed'
        } else if (nowMinutes >= scheduledMinutes) {
          status = Math.random() < 0.6 ? 'taken' : 'pending'
        } else {
          status = 'pending'
        }
      }

      records.push({
        id: `med-${idCounter++}`,
        elderlyId: '1',
        name: rx.name,
        dosage: rx.dosage,
        frequency: rx.frequency,
        scheduledTime: rx.time,
        status,
        date: dateStr,
        notes: rx.notes,
      })
    }
  }

  return records
}

export const medications: Medication[] = generateMedications()

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

export const appointments: Appointment[] = [
  {
    id: 'apt1',
    elderlyId: '1',
    serviceType: 'home_care',
    title: '居家照护服务',
    description: '协助老人日常起居、洗漱、更衣等生活照料',
    appointmentDate: '2026-06-10',
    appointmentTime: '09:00',
    address: '幸福社区服务中心',
    status: 'family_pending',
    applicantName: '张建国',
    applicantPhone: '138-0000-1234',
    familyContactId: 'c1',
    familyConfirmed: false,
    createdAt: '2026-06-07 10:30',
    notes: '老人近期行动不便，需要协助日常活动',
  },
  {
    id: 'apt2',
    elderlyId: '1',
    serviceType: 'medical_assist',
    title: '医疗陪诊服务',
    description: '陪同老人前往医院就诊，协助挂号、取药等',
    appointmentDate: '2026-06-12',
    appointmentTime: '08:30',
    address: '市第一人民医院',
    status: 'family_confirmed',
    applicantName: '张美华',
    applicantPhone: '139-0000-5678',
    familyContactId: 'c2',
    familyConfirmed: true,
    familyConfirmTime: '2026-06-06 15:20',
    createdAt: '2026-06-05 14:00',
    notes: '需复查血压和血糖情况',
  },
  {
    id: 'apt3',
    elderlyId: '1',
    serviceType: 'housekeeping',
    title: '家政清洁服务',
    description: '上门进行家庭清洁、整理等家政服务',
    appointmentDate: '2026-06-09',
    appointmentTime: '14:00',
    address: '老人住所',
    status: 'family_confirmed',
    applicantName: '张建国',
    applicantPhone: '138-0000-1234',
    familyContactId: 'c1',
    familyConfirmed: true,
    familyConfirmTime: '2026-06-07 09:10',
    createdAt: '2026-06-06 11:00',
    notes: '每周一次常规清洁',
  },
  {
    id: 'apt4',
    elderlyId: '1',
    serviceType: 'psychological',
    title: '心理关怀探访',
    description: '专业社工定期上门心理疏导与情感陪伴',
    appointmentDate: '2026-06-11',
    appointmentTime: '10:00',
    address: '老人住所',
    status: 'pending',
    applicantName: '李明',
    applicantPhone: '136-0000-9012',
    familyContactId: 'c3',
    familyConfirmed: false,
    createdAt: '2026-06-08 08:00',
    notes: '老人近期情绪低落，希望安排心理疏导',
  },
  {
    id: 'apt5',
    elderlyId: '1',
    serviceType: 'accompany',
    title: '外出陪护服务',
    description: '陪同老人前往公园散步、购物等户外活动',
    appointmentDate: '2026-06-05',
    appointmentTime: '15:00',
    address: '社区公园',
    status: 'completed',
    applicantName: '张美华',
    applicantPhone: '139-0000-5678',
    familyContactId: 'c2',
    familyConfirmed: true,
    familyConfirmTime: '2026-06-03 18:30',
    createdAt: '2026-06-03 10:00',
    notes: '天气晴好时安排户外活动',
  },
  {
    id: 'apt6',
    elderlyId: '1',
    serviceType: 'emergency',
    title: '紧急救助服务',
    description: '老人突发身体不适时的紧急上门救助',
    appointmentDate: '2026-06-04',
    appointmentTime: '16:30',
    address: '老人住所',
    status: 'completed',
    applicantName: '张建国',
    applicantPhone: '138-0000-1234',
    familyContactId: 'c1',
    familyConfirmed: true,
    familyConfirmTime: '2026-06-04 16:32',
    createdAt: '2026-06-04 16:25',
    notes: '老人跌倒后紧急呼叫',
  },
  {
    id: 'apt7',
    elderlyId: '1',
    serviceType: 'home_care',
    title: '居家照护服务',
    description: '协助老人日常起居、洗漱、更衣等生活照料',
    appointmentDate: '2026-06-02',
    appointmentTime: '09:00',
    address: '老人住所',
    status: 'rejected',
    applicantName: '张建国',
    applicantPhone: '138-0000-1234',
    familyContactId: 'c1',
    familyConfirmed: false,
    rejectReason: '该时段服务人员已满，建议改约其他时间',
    createdAt: '2026-05-30 10:00',
    notes: '老人近期行动不便',
  },
  {
    id: 'apt8',
    elderlyId: '1',
    serviceType: 'medical_assist',
    title: '医疗陪诊服务',
    description: '陪同老人前往医院就诊，协助挂号、取药等',
    appointmentDate: '2026-06-01',
    appointmentTime: '08:00',
    address: '市第一人民医院',
    status: 'cancelled',
    applicantName: '张美华',
    applicantPhone: '139-0000-5678',
    familyContactId: 'c2',
    familyConfirmed: true,
    familyConfirmTime: '2026-05-29 10:00',
    createdAt: '2026-05-28 09:00',
    notes: '因老人身体不适临时取消',
  },
  {
    id: 'apt9',
    elderlyId: '1',
    serviceType: 'housekeeping',
    title: '家政清洁服务',
    description: '上门进行家庭清洁、整理等家政服务',
    appointmentDate: '2026-06-06',
    appointmentTime: '14:00',
    address: '老人住所',
    status: 'family_rejected',
    applicantName: '李明',
    applicantPhone: '136-0000-9012',
    familyContactId: 'c3',
    familyConfirmed: false,
    rejectReason: '家属认为该时段不合适，建议改约上午',
    createdAt: '2026-06-04 08:00',
    notes: '常规清洁服务',
  },
]

export const careTasks: CareTask[] = [
  {
    id: 'ct1',
    elderlyId: '1',
    title: '协助洗漱更衣',
    description: '帮助老人完成晨间洗漱、更衣等日常起居活动',
    category: 'daily_care',
    priority: 'high',
    status: 'pending',
    assignedContactId: 'c1',
    scheduledDate: '2026-06-08',
    scheduledTime: '07:00',
    durationMinutes: 30,
    recurringRule: 'daily',
    createdAt: '2026-06-01 09:00',
  },
  {
    id: 'ct2',
    elderlyId: '1',
    title: '准备午餐',
    description: '为老人准备营养均衡的午餐，注意低盐低糖饮食',
    category: 'daily_care',
    priority: 'high',
    status: 'completed',
    assignedContactId: 'c4',
    scheduledDate: '2026-06-08',
    scheduledTime: '11:00',
    durationMinutes: 60,
    recurringRule: 'daily',
    completedAt: '2026-06-08 11:50',
    createdAt: '2026-06-01 09:00',
  },
  {
    id: 'ct3',
    elderlyId: '1',
    title: '陪护就医复查',
    description: '陪同老人前往医院进行血压、血糖复查',
    category: 'medical',
    priority: 'high',
    status: 'pending',
    assignedContactId: 'c2',
    scheduledDate: '2026-06-12',
    scheduledTime: '08:30',
    durationMinutes: 180,
    createdAt: '2026-06-05 14:00',
  },
  {
    id: 'ct4',
    elderlyId: '1',
    title: '居家清洁整理',
    description: '每周一次全屋清洁，包括厨房、卫生间重点消毒',
    category: 'housework',
    priority: 'medium',
    status: 'in_progress',
    assignedContactId: 'c3',
    scheduledDate: '2026-06-09',
    scheduledTime: '14:00',
    durationMinutes: 120,
    recurringRule: 'weekly',
    createdAt: '2026-06-01 09:00',
  },
  {
    id: 'ct5',
    elderlyId: '1',
    title: '散步陪伴',
    description: '天气好时陪同老人在社区公园散步30分钟',
    category: 'accompany',
    priority: 'medium',
    status: 'pending',
    assignedContactId: 'c5',
    scheduledDate: '2026-06-08',
    scheduledTime: '16:00',
    durationMinutes: 45,
    recurringRule: 'daily',
    createdAt: '2026-06-01 09:00',
  },
  {
    id: 'ct6',
    elderlyId: '1',
    title: '心理关怀聊天',
    description: '与老人聊天交流，了解心理状态，给予情感支持',
    category: 'emotional',
    priority: 'medium',
    status: 'pending',
    assignedContactId: 'c2',
    scheduledDate: '2026-06-08',
    scheduledTime: '19:00',
    durationMinutes: 30,
    recurringRule: 'daily',
    createdAt: '2026-06-01 09:00',
  },
  {
    id: 'ct7',
    elderlyId: '1',
    title: '代缴水电费',
    description: '代老人缴纳本月水电燃气等生活费用',
    category: 'finance',
    priority: 'low',
    status: 'completed',
    assignedContactId: 'c3',
    scheduledDate: '2026-06-05',
    scheduledTime: '10:00',
    durationMinutes: 30,
    completedAt: '2026-06-05 10:20',
    createdAt: '2026-06-01 09:00',
  },
  {
    id: 'ct8',
    elderlyId: '1',
    title: '晚间用药监督',
    description: '确保老人按时服用辛伐他汀和钙尔奇D',
    category: 'medical',
    priority: 'high',
    status: 'pending',
    assignedContactId: 'c1',
    scheduledDate: '2026-06-08',
    scheduledTime: '21:00',
    durationMinutes: 15,
    recurringRule: 'daily',
    createdAt: '2026-06-01 09:00',
  },
  {
    id: 'ct9',
    elderlyId: '1',
    title: '协助沐浴',
    description: '协助老人进行晚间沐浴，注意防滑安全',
    category: 'daily_care',
    priority: 'high',
    status: 'pending',
    assignedContactId: 'c4',
    scheduledDate: '2026-06-08',
    scheduledTime: '20:00',
    durationMinutes: 40,
    recurringRule: 'daily',
    createdAt: '2026-06-01 09:00',
  },
  {
    id: 'ct10',
    elderlyId: '1',
    title: '采购生活用品',
    description: '代为采购老人日常所需食品和日用品',
    category: 'daily_care',
    priority: 'low',
    status: 'overdue',
    assignedContactId: 'c5',
    scheduledDate: '2026-06-07',
    scheduledTime: '09:00',
    durationMinutes: 60,
    createdAt: '2026-06-04 10:00',
  },
]

export const todoItems: TodoItem[] = [
  {
    id: 'todo1',
    elderlyId: '1',
    title: '服用硝苯地平缓释片 30mg',
    source: 'medication',
    sourceId: 'med-350',
    scheduledDate: '2026-06-08',
    scheduledTime: '08:00',
    status: 'done',
    assignedContactId: 'c1',
    createdAt: '2026-06-08 00:00',
  },
  {
    id: 'todo2',
    elderlyId: '1',
    title: '居家照护服务确认',
    source: 'appointment',
    sourceId: 'apt1',
    scheduledDate: '2026-06-10',
    scheduledTime: '09:00',
    status: 'pending',
    assignedContactId: 'c1',
    createdAt: '2026-06-07 10:30',
  },
  {
    id: 'todo3',
    elderlyId: '1',
    title: '血压异常关注',
    source: 'alert',
    sourceId: 'a1',
    scheduledDate: '2026-06-08',
    scheduledTime: '08:05',
    status: 'pending',
    createdAt: '2026-06-08 08:05',
  },
  {
    id: 'todo4',
    elderlyId: '1',
    title: '晚间用药监督',
    source: 'manual',
    scheduledDate: '2026-06-08',
    scheduledTime: '21:00',
    status: 'pending',
    assignedContactId: 'c1',
    createdAt: '2026-06-01 09:00',
  },
  {
    id: 'todo5',
    elderlyId: '1',
    title: '陪护就医复查',
    source: 'appointment',
    sourceId: 'apt2',
    scheduledDate: '2026-06-12',
    scheduledTime: '08:30',
    status: 'pending',
    assignedContactId: 'c2',
    syncedAt: '2026-06-06 15:20',
    createdAt: '2026-06-05 14:00',
  },
  {
    id: 'todo6',
    elderlyId: '1',
    title: '服用二甲双胍 500mg',
    source: 'medication',
    sourceId: 'med-351',
    scheduledDate: '2026-06-08',
    scheduledTime: '08:00',
    status: 'synced',
    assignedContactId: 'c1',
    syncedAt: '2026-06-08 07:50',
    createdAt: '2026-06-08 00:00',
  },
  {
    id: 'todo7',
    elderlyId: '1',
    title: '心理关怀探访安排',
    source: 'appointment',
    sourceId: 'apt4',
    scheduledDate: '2026-06-11',
    scheduledTime: '10:00',
    status: 'pending',
    assignedContactId: 'c3',
    createdAt: '2026-06-08 08:00',
  },
  {
    id: 'todo8',
    elderlyId: '1',
    title: '协助洗漱更衣',
    source: 'manual',
    scheduledDate: '2026-06-08',
    scheduledTime: '07:00',
    status: 'pending',
    assignedContactId: 'c1',
    createdAt: '2026-06-01 09:00',
  },
]
