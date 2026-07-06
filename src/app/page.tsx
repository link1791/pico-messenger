'use client'

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  MessageSquare,
  Send,
  Plus,
  Settings,
  Radio,
  Hash,
  ArrowLeft,
  Trash2,
} from 'lucide-react'

interface Message {
  id: string
  from: string
  to: string
  text: string
  ts: string
  direction: 'in' | 'out'
}

interface Conversation {
  contact: string
  lastText: string
  lastTs: string
  unread: number
}

function UsernameSetup({ onJoin }: { onJoin: (name: string) => void }) {
  const [name, setName] = useState('')

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Radio className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Pico Messenger</h1>
          <p className="text-sm text-muted-foreground mt-1">
            WiFi Pico W message relay server
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <label className="text-sm font-medium mb-2 block">
            Choose your username
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. alice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) onJoin(name.trim())
              }}
              maxLength={20}
              className="flex-1"
            />
            <Button
              onClick={() => name.trim() && onJoin(name.trim())}
              disabled={!name.trim()}
            >
              Join
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            This is also the server for your Pico W devices.
            Set the server IP to this website&apos;s address.
          </p>
        </div>

        <div className="mt-6 rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4" /> API Endpoints
          </h3>
          <div className="text-xs font-mono text-muted-foreground space-y-1">
            <p>POST /api/send</p>
            <p>GET /api/messages?user=X&amp;from=Y</p>
            <p>GET /api/contacts</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTime(ts: string) {
  try {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()

    if (diff < 60000) return 'now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return `${d.getDate()}/${d.getMonth() + 1}`
  } catch {
    return ''
  }
}

function ChatView({
  username,
  contact,
  onBack,
}: {
  username: string
  contact: string
  onBack: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const refreshMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/chat?username=${encodeURIComponent(username)}&contact=${encodeURIComponent(contact)}`
      )
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch (e) {
      console.error('Fetch messages failed', e)
    }
  }, [username, contact])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!active) return
      try {
        const res = await fetch(
          `/api/chat?username=${encodeURIComponent(username)}&contact=${encodeURIComponent(contact)}`
        )
        const data = await res.json()
        if (data.messages && active) setMessages(data.messages)
      } catch (e) {
        console.error('Fetch messages failed', e)
      }
    }
    load()
    const interval = setInterval(load, 3000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [username, contact])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, contact, text: text.trim() }),
      })
      setText('')
      await refreshMessages()
    } catch (e) {
      console.error('Send failed', e)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{contact}</h2>
          <p className="text-xs text-muted-foreground">Pico Messenger</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete chat with {contact}?</DialogTitle>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline">Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await fetch(
                    `/api/chat?username=${encodeURIComponent(username)}&contact=${encodeURIComponent(contact)}`,
                    { method: 'DELETE' }
                  )
                  onBack()
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-2 max-w-2xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-12">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No messages yet. Say hello!
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.direction === 'out'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    m.direction === 'out'
                      ? 'text-primary-foreground/60'
                      : 'text-muted-foreground'
                  }`}
                >
                  {formatTime(m.ts)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card p-3 shrink-0">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage()
            }}
            maxLength={500}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  // Load username from localStorage via useSyncExternalStore
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('pico-messenger-username')
  }, [])
  const getServerSnapshot = useCallback(() => null, [])
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback)
    return () => window.removeEventListener('storage', callback)
  }, [])
  const username = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const setUsernameAction = useCallback((name: string | null) => {
    if (name === null) {
      localStorage.removeItem('pico-messenger-username')
    } else {
      localStorage.setItem('pico-messenger-username', name)
    }
    window.dispatchEvent(new Event('storage'))
  }, [])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [newContactName, setNewContactName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [allContacts, setAllContacts] = useState<string[]>([])
  useEffect(() => {
    if (!username) return
    const fetchConversations = async () => {
      try {
        const res = await fetch(
          `/api/conversations?username=${encodeURIComponent(username)}`
        )
        const data = await res.json()
        if (data.conversations) setConversations(data.conversations)
      } catch (e) {
        console.error('Fetch convos failed', e)
      }
    }
    fetchConversations()
    const interval = setInterval(fetchConversations, 3000)
    return () => clearInterval(interval)
  }, [username])

  // Poll all contacts (registered by Pico devices)
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch('/api/contacts')
        const text = await res.text()
        if (text.trim()) {
          setAllContacts(text.trim().split('\n').filter(Boolean))
        }
      } catch {
        // ignore
      }
    }
    fetchContacts()
    const interval = setInterval(fetchContacts, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleJoin = (name: string) => {
    setUsernameAction(name)
  }

  const handleLogout = () => {
    setUsernameAction(null)
    setSelectedContact(null)
  }

  const handleNewContact = async () => {
    if (!newContactName.trim() || !username) return
    // Send a system message to create the conversation
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          contact: newContactName.trim(),
          text: '(started conversation)',
        }),
      })
    } catch {
      // ignore
    }
    setNewContactName('')
    setDialogOpen(false)
  }

  // Remove current user from all-contacts list for display
  const otherContacts = allContacts.filter((c) => c !== username)

  if (!username) {
    return <UsernameSetup onJoin={handleJoin} />
  }

  if (selectedContact) {
    return (
      <ChatView
        username={username}
        contact={selectedContact}
        onBack={() => {
          setSelectedContact(null)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Radio className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Pico Messenger</h1>
            <p className="text-xs text-muted-foreground">@{username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Username to message..."
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNewContact()
                  }}
                  maxLength={20}
                />
                {otherContacts.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground font-medium">
                      Known Pico devices
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {otherContacts.map((c) => (
                        <Button
                          key={c}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedContact(c)
                            setDialogOpen(false)
                          }}
                        >
                          {c}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tap + to start messaging
              </p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.contact}
                onClick={() => setSelectedContact(c.contact)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                  {c.contact[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {c.contact}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                      {formatTime(c.lastTs)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.lastText}
                  </p>
                </div>
                {c.unread > 0 && (
                  <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0.5">
                    {c.unread}
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Info bar */}
      <div className="border-t bg-muted/30 px-4 py-2 shrink-0">
        <p className="text-[10px] text-muted-foreground text-center">
          Pico W devices: POST /api/send &middot; GET /api/messages?user=X&amp;from=Y
        </p>
      </div>
    </div>
  )
}