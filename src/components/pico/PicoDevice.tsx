'use client'

import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import HomeScreen from './HomeScreen'
import ChatScreen from './ChatScreen'
import SettingsScreen from './SettingsScreen'

export default function PicoDevice() {
  const { view, wifiStatus } = useAppStore()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-green-950/20 to-gray-950 p-4">
      {/* Background grid effect */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,255,100,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.3) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      {/* Device frame */}
      <div className="relative">
        {/* Device body */}
        <div className={cn(
          'relative rounded-xl p-3 transition-all duration-500',
          'bg-gradient-to-b from-gray-800 via-gray-850 to-gray-900',
          'border border-gray-600/30',
          'shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_120px_rgba(0,0,0,0.4)]',
          'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none'
        )} style={{
          width: 'min(380px, 90vw)',
        }}>
          {/* Top bezel - brand label */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[9px] font-mono text-gray-400 tracking-widest uppercase">WiFi Pico</span>
            <div className="flex items-center gap-1">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors duration-300',
                wifiStatus === 'connected' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]' :
                wifiStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
              )} />
              <span className="text-[7px] font-mono text-gray-500">DEIMOS</span>
            </div>
          </div>

          {/* Screen bezel */}
          <div className="relative bg-black rounded-lg p-[3px] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            {/* Screen glow effect */}
            <div className="absolute -inset-1 rounded-lg opacity-30 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at center, rgba(0,255,100,0.15) 0%, transparent 70%)',
              filter: 'blur(4px)',
            }} />

            {/* Actual screen */}
            <div className="relative bg-[#0a0a0a] rounded-md overflow-hidden" style={{
              width: '100%',
              height: 'min(480px, 65vh)',
              imageRendering: 'pixelated',
            }}>
              {/* Scanline effect */}
              <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
              }} />

              {/* Screen content */}
              <div className="relative z-0 h-full font-pixel text-green-400">
                {/* Boot animation overlay */}
                <BootOverlay />

                {view === 'home' && <HomeScreen />}
                {view === 'chat' && <ChatScreen />}
                {view === 'settings' && <SettingsScreen />}
              </div>

              {/* Screen edge vignette */}
              <div className="absolute inset-0 pointer-events-none z-20 rounded-md" style={{
                background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
              }} />
            </div>
          </div>

          {/* Bottom bezel - buttons */}
          <div className="flex items-center justify-center gap-6 mt-3">
            <DeviceButton label="A" />
            <DeviceButton label="B" />
            <DeviceButton label="MENU" wide />
          </div>

          {/* USB-C port indicator */}
          <div className="flex items-center justify-center mt-2">
            <div className="w-8 h-1.5 bg-gray-700 rounded-full border border-gray-600/50" />
          </div>
        </div>

        {/* Shadow reflection */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-green-400/5 blur-xl rounded-full" />
      </div>

      {/* Page title below device */}
      <div className="mt-8 text-center">
        <h1 className="text-lg font-mono text-gray-300 tracking-wide">WiFi Pico Messenger</h1>
        <p className="text-xs text-gray-500 font-mono mt-1">deimos firmware • real-time messaging</p>
      </div>
    </div>
  )
}

function DeviceButton({ label, wide }: { label: string; wide?: boolean }) {
  return (
    <button className={cn(
      'bg-gray-700/80 border border-gray-500/30 rounded-md text-gray-400 font-mono',
      'hover:bg-gray-600/80 hover:text-gray-300 active:bg-gray-800/80',
      'transition-all duration-150 active:scale-95',
      wide ? 'px-5 py-1 text-[9px]' : 'w-8 h-8 text-[10px]'
    )}>
      {label}
    </button>
  )
}

function BootOverlay() {
  const [show, setShow] = React.useState(true)
  const [lines, setLines] = React.useState<string[]>([])

  React.useEffect(() => {
    const bootLines = [
      'deimos v2.4.1',
      'initializing...',
      'cpu: rp2040 @ 133MHz [OK]',
      'ram: 264KB [OK]',
      'flash: 2MB [OK]',
      'screen: 128x64 oled [OK]',
      'wifi: scanning...',
      'wifi: connected to deimos-net',
      'ip: 192.168.1.42',
      'loading messenger...',
      'ready.',
    ]

    let i = 0
    const interval = setInterval(() => {
      if (i < bootLines.length) {
        setLines(prev => [...prev, bootLines[i]])
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setShow(false), 400)
      }
    }, 150)

    return () => clearInterval(interval)
  }, [])

  if (!show) return null

  return (
    <div className="absolute inset-0 z-30 bg-[#0a0a0a] flex flex-col justify-center p-3">
      {lines.map((line, i) => (
        <div key={i} className="text-[7px] font-pixel text-green-500 leading-relaxed">
          <span className="text-green-700">{'>'}</span> {line}
        </div>
      ))}
      {lines.length > 0 && lines.length < 11 && (
        <span className="text-[7px] font-pixel text-green-500 animate-pulse ml-1">_</span>
      )}
    </div>
  )
}

