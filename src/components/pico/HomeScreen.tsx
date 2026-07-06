'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export default function HomeScreen() {
  const { contacts, setActiveContact, wifiStatus, userName, setView } = useAppStore()

  return (
    <div className="flex flex-col h-full select-none">
      {/* Status bar */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-green-900/50 bg-black/30">
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-pixel text-green-400">WIFI PICO</span>
          <span className={cn(
            'text-[7px] font-pixel',
            wifiStatus === 'connected' ? 'text-green-400' : wifiStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
          )}>
            {wifiStatus === 'connected' ? '●' : wifiStatus === 'connecting' ? '◌' : '○'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[7px] font-pixel text-green-500/60">{userName}</span>
        </div>
      </div>

      {/* Messages header */}
      <div className="px-2 py-1.5 bg-black/20">
        <span className="text-[10px] font-pixel-bold text-green-300 tracking-wider">MESSAGES</span>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto pico-scroll">
        {contacts.map((contact, i) => (
          <button
            key={contact.id}
            onClick={() => setActiveContact(contact.id)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 border-b border-green-900/30',
              'hover:bg-green-900/20 active:bg-green-900/40 transition-colors text-left',
              'group'
            )}
          >
            {/* Avatar */}
            <div className={cn(
              'w-6 h-6 flex items-center justify-center rounded-sm text-[10px] shrink-0',
              'bg-green-900/40 border border-green-700/40',
              contact.online && 'ring-1 ring-green-400/50 ring-offset-1 ring-offset-black'
            )}>
              {contact.avatar}
            </div>

            {/* Name & message */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-pixel-bold text-green-200 truncate">{contact.name}</span>
                <span className="text-[6px] font-pixel text-green-600 shrink-0 ml-1">{formatTime(contact.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[7px] font-pixel text-green-500/70 truncate">{contact.lastMessage}</span>
                {contact.unread > 0 && (
                  <span className="text-[7px] font-pixel text-black bg-green-400 rounded-sm px-1 shrink-0 ml-1">
                    {contact.unread}
                  </span>
                )}
              </div>
            </div>

            {/* Chevron */}
            <span className="text-[8px] text-green-700 group-hover:text-green-400 transition-colors">›</span>
          </button>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-around py-1.5 border-t border-green-900/50 bg-black/40">
        <button className="flex flex-col items-center gap-0.5 text-green-400">
          <span className="text-[10px]">💬</span>
          <span className="text-[6px] font-pixel text-green-400">msgs</span>
        </button>
        <button
          onClick={() => setView('settings')}
          className="flex flex-col items-center gap-0.5 text-green-600 hover:text-green-400 transition-colors"
        >
          <span className="text-[10px]">⚙️</span>
          <span className="text-[6px] font-pixel">setup</span>
        </button>
      </div>
    </div>
  )
}