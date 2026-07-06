'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore, type Message } from '@/lib/store'
import { cn } from '@/lib/utils'

function formatMessageTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function ChatScreen() {
  const { contacts, activeContactId, messages, addMessage, setView } = useAppStore()
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const contact = contacts.find(c => c.id === activeContactId)
  const chatMessages = activeContactId ? messages[activeContactId] || [] : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [activeContactId])

  const handleSend = () => {
    if (!inputText.trim() || !activeContactId) return

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      sender: 'me',
      text: inputText.trim(),
      timestamp: Date.now(),
    }
    addMessage(activeContactId, newMsg)
    setInputText('')

    // Simulate reply
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const replies = [
        'received!',
        'ok 👍',
        'copy that',
        '10-4',
        'roger!',
        'nice one',
        'will check',
        'sounds good',
        'on it',
        'sure thing',
        'let me see...',
        'hmm interesting',
        'cool!',
        ':-)',
        'deimos says hi',
      ]
      const reply: Message = {
        id: `m_${Date.now()}_r`,
        sender: 'them',
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: Date.now(),
      }
      addMessage(activeContactId, reply)
    }, 1200 + Math.random() * 2000)
  }

  if (!contact) return null

  return (
    <div className="flex flex-col h-full select-none">
      {/* Chat header */}
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-green-900/50 bg-black/30">
        <button
          onClick={() => setView('home')}
          className="text-green-400 hover:text-green-200 transition-colors text-[10px] font-pixel"
        >
          ‹ back
        </button>
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-[8px]">{contact.avatar}</span>
            <span className="text-[9px] font-pixel-bold text-green-300">{contact.name}</span>
            <span className={cn(
              'text-[6px]',
              contact.online ? 'text-green-400' : 'text-green-700'
            )}>
              {contact.online ? '● online' : '○ offline'}
            </span>
          </div>
        </div>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 pico-scroll">
        {/* Date separator */}
        <div className="flex items-center gap-2 my-1">
          <div className="flex-1 h-px bg-green-900/30" />
          <span className="text-[6px] font-pixel text-green-700">TODAY</span>
          <div className="flex-1 h-px bg-green-900/30" />
        </div>

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex my-0.5',
              msg.sender === 'me' ? 'justify-end' : 'justify-start'
            )}
          >
            <div className={cn(
              'max-w-[80%] px-2 py-1 rounded-sm',
              msg.sender === 'me'
                ? 'bg-green-800/50 border border-green-600/30'
                : 'bg-green-950/60 border border-green-900/30'
            )}>
              <p className="text-[8px] font-pixel text-green-200 leading-relaxed break-words">
                {msg.text}
              </p>
              <p className={cn(
                'text-[5px] font-pixel mt-0.5',
                msg.sender === 'me' ? 'text-green-500/50 text-right' : 'text-green-600/50'
              )}>
                {formatMessageTime(msg.timestamp)}
                {msg.sender === 'me' && ' ✓'}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start my-0.5">
            <div className="bg-green-950/60 border border-green-900/30 px-2 py-1 rounded-sm">
              <span className="text-[8px] font-pixel text-green-500 animate-pulse">typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-green-900/50 bg-black/40 px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="type msg..."
            className="flex-1 bg-green-950/50 border border-green-800/30 rounded-sm px-2 py-1 text-[8px] font-pixel text-green-200 placeholder:text-green-800 outline-none focus:border-green-600/50 transition-colors"
            maxLength={120}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={cn(
              'px-2 py-1 rounded-sm text-[8px] font-pixel-bold transition-all',
              inputText.trim()
                ? 'bg-green-700/60 text-green-100 hover:bg-green-600/60 active:bg-green-800/60 border border-green-500/30'
                : 'bg-green-900/20 text-green-800 border border-green-900/20 cursor-not-allowed'
            )}
          >
            SEND
          </button>
        </div>
        <div className="text-right mt-0.5">
          <span className="text-[5px] font-pixel text-green-800">
            {inputText.length}/120
          </span>
        </div>
      </div>
    </div>
  )
}