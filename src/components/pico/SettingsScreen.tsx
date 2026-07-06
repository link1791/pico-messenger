'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export default function SettingsScreen() {
  const { wifiStatus, setWifiStatus, userName, setUserName, setView } = useAppStore()
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState(userName)
  const [showAbout, setShowAbout] = useState(false)

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim())
    }
    setEditingName(false)
  }

  const handleToggleWifi = () => {
    if (wifiStatus === 'connected') {
      setWifiStatus('disconnected')
    } else {
      setWifiStatus('connecting')
      setTimeout(() => setWifiStatus('connected'), 1500)
    }
  }

  if (showAbout) {
    return (
      <div className="flex flex-col h-full select-none">
        <div className="flex items-center gap-2 px-2 py-1.5 border-b border-green-900/50 bg-black/30">
          <button
            onClick={() => setShowAbout(false)}
            className="text-green-400 hover:text-green-200 transition-colors text-[10px] font-pixel"
          >
            ‹ back
          </button>
          <span className="text-[9px] font-pixel-bold text-green-300 flex-1 text-center">ABOUT</span>
          <div className="w-8" />
        </div>
        <div className="flex-1 p-2 overflow-y-auto pico-scroll">
          <div className="text-center mb-3">
            <div className="text-[10px] font-pixel-bold text-green-300 mb-0.5">WIFI PICO MSG</div>
            <div className="text-[7px] font-pixel text-green-600">v1.0.0-alpha</div>
          </div>

          <div className="space-y-2 text-[7px] font-pixel text-green-400">
            <div className="border border-green-900/30 rounded-sm p-1.5">
              <div className="text-green-300 mb-1">FIRMWARE</div>
              <div>deimos v2.4.1</div>
              <div>build: 2025.11.17</div>
            </div>

            <div className="border border-green-900/30 rounded-sm p-1.5">
              <div className="text-green-300 mb-1">HARDWARE</div>
              <div>rp2040 @ 133MHz</div>
              <div>ram: 264KB</div>
              <div>flash: 2MB</div>
              <div>screen: 128x64 oled</div>
            </div>

            <div className="border border-green-900/30 rounded-sm p-1.5">
              <div className="text-green-300 mb-1">NETWORK</div>
              <div>wifi: 802.11 b/g/n</div>
              <div>proto: tcp/udp</div>
              <div>port: 31337</div>
            </div>

            <div className="border border-green-900/30 rounded-sm p-1.5">
              <div className="text-green-300 mb-1">LIBRARIES</div>
              <div>cwio v3.1</div>
              <div>ui v1.2</div>
              <div>net v2.0</div>
            </div>

            <div className="text-center mt-3 text-green-700">
              <div>© 2025 deimos project</div>
              <div>open source hw/sw</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-green-900/50 bg-black/30">
        <button
          onClick={() => setView('home')}
          className="text-green-400 hover:text-green-200 transition-colors text-[10px] font-pixel"
        >
          ‹ back
        </button>
        <span className="text-[9px] font-pixel-bold text-green-300 flex-1 text-center">SETTINGS</span>
        <div className="w-8" />
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto p-2 pico-scroll">
        <div className="space-y-2.5">
          {/* WiFi Status */}
          <div className="border border-green-900/30 rounded-sm p-1.5">
            <div className="text-[8px] font-pixel-bold text-green-300 mb-1.5">WiFi</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px]">📡</span>
                <div>
                  <div className={cn(
                    'text-[7px] font-pixel',
                    wifiStatus === 'connected' ? 'text-green-400' :
                    wifiStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {wifiStatus === 'connected' ? 'CONNECTED' :
                     wifiStatus === 'connecting' ? 'CONNECTING...' : 'DISCONNECTED'}
                  </div>
                  <div className="text-[6px] font-pixel text-green-600">deimos-net</div>
                </div>
              </div>
              <button
                onClick={handleToggleWifi}
                className={cn(
                  'px-1.5 py-0.5 rounded-sm text-[7px] font-pixel border transition-colors',
                  wifiStatus === 'connected'
                    ? 'bg-green-800/40 border-green-600/30 text-green-300 hover:bg-red-900/30 hover:border-red-700/30 hover:text-red-300'
                    : 'bg-green-900/20 border-green-800/30 text-green-500 hover:bg-green-800/30'
                )}
              >
                {wifiStatus === 'connected' ? 'DISCONNECT' : 'CONNECT'}
              </button>
            </div>
          </div>

          {/* Username */}
          <div className="border border-green-900/30 rounded-sm p-1.5">
            <div className="text-[8px] font-pixel-bold text-green-300 mb-1.5">USERNAME</div>
            {editingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="flex-1 bg-green-950/50 border border-green-700/30 rounded-sm px-1.5 py-0.5 text-[8px] font-pixel text-green-200 outline-none focus:border-green-500/50"
                  maxLength={16}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="px-1.5 py-0.5 bg-green-800/40 border border-green-600/30 rounded-sm text-[7px] font-pixel text-green-300 hover:bg-green-700/40"
                >
                  SAVE
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setTempName(userName); setEditingName(true) }}
                className="flex items-center justify-between w-full group"
              >
                <span className="text-[7px] font-pixel text-green-400">@{userName}</span>
                <span className="text-[7px] font-pixel text-green-700 group-hover:text-green-400">EDIT</span>
              </button>
            )}
          </div>

          {/* Display */}
          <div className="border border-green-900/30 rounded-sm p-1.5">
            <div className="text-[8px] font-pixel-bold text-green-300 mb-1.5">DISPLAY</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[7px] font-pixel text-green-400">BRIGHTNESS</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <span key={lvl} className="text-[7px] text-green-500">■</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[7px] font-pixel text-green-400">CONTRAST</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(lvl => (
                    <span key={lvl} className="text-[7px] text-green-500">■</span>
                  ))}
                  {[4, 5].map(lvl => (
                    <span key={lvl} className="text-[7px] text-green-800">□</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="border border-green-900/30 rounded-sm p-1.5">
            <div className="text-[8px] font-pixel-bold text-green-300 mb-1.5">NETWORK</div>
            <div className="space-y-0.5 text-[7px] font-pixel text-green-500">
              <div>IP: 192.168.1.{42 + Math.floor(Math.random() * 10)}</div>
              <div>PORT: 31337</div>
              <div>SIGNAL: -42 dBm</div>
              <div>PROTOCOL: TCP</div>
            </div>
          </div>

          {/* About */}
          <button
            onClick={() => setShowAbout(true)}
            className="w-full border border-green-900/30 rounded-sm p-1.5 text-left hover:bg-green-900/20 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[8px] font-pixel-bold text-green-300">ABOUT</div>
                <div className="text-[6px] font-pixel text-green-600">wifi pico msg v1.0.0</div>
              </div>
              <span className="text-[8px] text-green-700 group-hover:text-green-400">›</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}