import { create } from 'zustand'

export interface Message {
  id: string
  sender: 'me' | 'them'
  text: string
  timestamp: number
}

export interface Contact {
  id: string
  name: string
  avatar: string
  lastMessage: string
  timestamp: number
  unread: number
  online: boolean
}

interface AppState {
  view: 'home' | 'chat' | 'settings'
  contacts: Contact[]
  activeContactId: string | null
  messages: Record<string, Message[]>
  userName: string
  wifiStatus: 'connected' | 'connecting' | 'disconnected'
  setView: (view: 'home' | 'chat' | 'settings') => void
  setActiveContact: (id: string) => void
  addMessage: (contactId: string, message: Message) => void
  setWifiStatus: (status: 'connected' | 'connecting' | 'disconnected') => void
  setUserName: (name: string) => void
}

const initialContacts: Contact[] = [
  {
    id: '1',
    name: 'deimos-bot',
    avatar: '🤖',
    lastMessage: 'wifi pico ready.',
    timestamp: Date.now() - 60000,
    unread: 1,
    online: true,
  },
  {
    id: '2',
    name: '0xDEAD',
    avatar: '💀',
    lastMessage: 'check the new fw update',
    timestamp: Date.now() - 300000,
    unread: 0,
    online: true,
  },
  {
    id: '3',
    name: 'pico_dev',
    avatar: '🔧',
    lastMessage: 'the screen lib works now',
    timestamp: Date.now() - 1800000,
    unread: 2,
    online: false,
  },
  {
    id: '4',
    name: 'wifi_hacker',
    avatar: '📡',
    lastMessage: 'signal strength: -42dBm',
    timestamp: Date.now() - 3600000,
    unread: 0,
    online: true,
  },
  {
    id: '5',
    name: 'pixel_art',
    avatar: '🎨',
    lastMessage: 'sent an image',
    timestamp: Date.now() - 7200000,
    unread: 0,
    online: false,
  },
  {
    id: '6',
    name: 'kernel_panic',
    avatar: '⚠️',
    lastMessage: 'fixed the crash bug',
    timestamp: Date.now() - 86400000,
    unread: 0,
    online: false,
  },
]

const initialMessages: Record<string, Message[]> = {
  '1': [
    { id: 'm1', sender: 'them', text: 'booting deimos v2.4...', timestamp: Date.now() - 300000 },
    { id: 'm2', sender: 'them', text: 'wifi module init [OK]', timestamp: Date.now() - 290000 },
    { id: 'm3', sender: 'them', text: 'screen driver loaded', timestamp: Date.now() - 280000 },
    { id: 'm4', sender: 'me', text: 'hello pico!', timestamp: Date.now() - 120000 },
    { id: 'm5', sender: 'them', text: 'wifi pico ready.', timestamp: Date.now() - 60000 },
  ],
  '2': [
    { id: 'm6', sender: 'them', text: 'yo just pushed new code', timestamp: Date.now() - 600000 },
    { id: 'm7', sender: 'me', text: 'nice, what changed?', timestamp: Date.now() - 500000 },
    { id: 'm8', sender: 'them', text: 'check the new fw update', timestamp: Date.now() - 300000 },
  ],
  '3': [
    { id: 'm9', sender: 'them', text: 'been working on cwio lib', timestamp: Date.now() - 2400000 },
    { id: 'm10', sender: 'me', text: 'how is it going?', timestamp: Date.now() - 2000000 },
    { id: 'm11', sender: 'them', text: 'had some display issues', timestamp: Date.now() - 1900000 },
    { id: 'm12', sender: 'them', text: 'the screen lib works now', timestamp: Date.now() - 1800000 },
  ],
  '4': [
    { id: 'm13', sender: 'them', text: 'just scanned nearby networks', timestamp: Date.now() - 4000000 },
    { id: 'm14', sender: 'me', text: 'how many did you find?', timestamp: Date.now() - 3900000 },
    { id: 'm15', sender: 'them', text: 'signal strength: -42dBm', timestamp: Date.now() - 3600000 },
  ],
  '5': [
    { id: 'm16', sender: 'them', text: 'made a new sprite', timestamp: Date.now() - 8000000 },
    { id: 'm17', sender: 'them', text: 'sent an image', timestamp: Date.now() - 7200000 },
  ],
  '6': [
    { id: 'm18', sender: 'them', text: 'found a nasty mem leak', timestamp: Date.now() - 100000000 },
    { id: 'm19', sender: 'me', text: 'oh no, what was it?', timestamp: Date.now() - 99000000 },
    { id: 'm20', sender: 'them', text: 'fixed the crash bug', timestamp: Date.now() - 86400000 },
  ],
}

export const useAppStore = create<AppState>((set) => ({
  view: 'home',
  contacts: initialContacts,
  activeContactId: null,
  messages: initialMessages,
  userName: 'user',
  wifiStatus: 'connected',
  setView: (view) => set({ view }),
  setActiveContact: (id) => set({ activeContactId: id, view: 'chat' }),
  addMessage: (contactId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [contactId]: [...(state.messages[contactId] || []), message],
      },
    })),
  setWifiStatus: (wifiStatus) => set({ wifiStatus }),
  setUserName: (userName) => set({ userName }),
}))