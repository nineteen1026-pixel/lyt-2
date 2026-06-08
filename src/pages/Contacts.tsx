import { Phone, Users, AlertCircle, Heart, User } from 'lucide-react'
import { contacts } from '@/data/mockData'
import type { Contact } from '@/types'

const relationshipColors: Record<string, string> = {
  '儿子': 'bg-care-100 text-care-700',
  '女儿': 'bg-health-100 text-health-600',
  '女婿': 'bg-info-100 text-info-500',
  '儿媳': 'bg-care-100 text-care-700',
  '孙子': 'bg-health-100 text-health-600',
  '家庭医生': 'bg-danger-50 text-danger-600',
}

const avatarColors: Record<string, string> = {
  '儿子': 'bg-care-500',
  '女儿': 'bg-health-500',
  '女婿': 'bg-info-500',
  '儿媳': 'bg-care-400',
  '孙子': 'bg-health-400',
  '家庭医生': 'bg-danger-500',
}

function getRelationshipBadge(relationship: string) {
  return relationshipColors[relationship] || 'bg-warm-200 text-warm-700'
}

function getAvatarColor(relationship: string) {
  return avatarColors[relationship] || 'bg-warm-400'
}

function EmergencyCard({ contact }: { contact: Contact }) {
  return (
    <div className="animate-pulse-soft relative bg-danger-50 border border-danger-200 rounded-2xl p-5 border-l-4 border-l-danger-500 transition-shadow hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-full ${getAvatarColor(contact.relationship)} flex items-center justify-center text-white text-xl font-bold shrink-0`}>
          {contact.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-warm-800 text-lg">{contact.name}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRelationshipBadge(contact.relationship)}`}>
              {contact.relationship}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-warm-500 text-sm">
            <Phone className="w-3.5 h-3.5" />
            <span>{contact.phone}</span>
          </div>
        </div>
      </div>
      <button className="mt-4 w-full flex items-center justify-center gap-2 bg-care-500 hover:bg-care-600 text-white font-semibold py-3 rounded-xl transition-colors active:scale-[0.98]">
        <Phone className="w-5 h-5" />
        拨打电话
      </button>
    </div>
  )
}

function ContactRow({ contact }: { contact: Contact }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-warm-50 transition-colors group">
      <div className={`w-11 h-11 rounded-full ${getAvatarColor(contact.relationship)} flex items-center justify-center text-white text-base font-bold shrink-0`}>
        {contact.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-warm-800">{contact.name}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRelationshipBadge(contact.relationship)}`}>
            {contact.relationship}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-warm-500 text-sm">
          <Phone className="w-3.5 h-3.5" />
          <span>{contact.phone}</span>
        </div>
      </div>
      <button className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-care-50 text-care-500 hover:bg-care-100 hover:text-care-600 transition-colors group-hover:scale-105 active:scale-95">
        <Phone className="w-4.5 h-4.5" />
      </button>
    </div>
  )
}

export default function Contacts() {
  const emergencyContacts = contacts.filter(c => c.isEmergency)
  const allContacts = contacts

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-800">家属联系人</h1>
        <p className="text-warm-400 text-sm mt-1">紧急情况快速联系家属</p>
      </div>

      <div className="bg-gradient-to-r from-danger-500 to-danger-600 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <AlertCircle className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-lg">一键拨打紧急联系人</p>
          <p className="text-white/80 text-sm mt-0.5">紧急情况优先联系紧急联系人</p>
        </div>
        <button className="shrink-0 flex items-center gap-2 bg-white text-danger-600 font-bold px-6 py-3 rounded-xl hover:bg-danger-50 transition-colors active:scale-95 shadow-md">
          <Phone className="w-5 h-5" />
          紧急呼叫
        </button>
      </div>

      <section className="animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-danger-500 rounded-full" />
          <h2 className="text-lg font-bold text-warm-800">紧急联系人</h2>
          <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-danger-500 text-white text-xs font-bold">
            {emergencyContacts.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyContacts.map(contact => (
            <EmergencyCard key={contact.id} contact={contact} />
          ))}
        </div>
      </section>

      <section className="animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-care-500 rounded-full" />
          <h2 className="text-lg font-bold text-warm-800">全部联系人</h2>
          <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-care-500 text-white text-xs font-bold">
            {allContacts.length}
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-warm-200 divide-y divide-warm-100 overflow-hidden">
          {allContacts.map(contact => (
            <ContactRow key={contact.id} contact={contact} />
          ))}
        </div>
      </section>
    </div>
  )
}
