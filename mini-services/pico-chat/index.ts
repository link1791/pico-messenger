import { Server } from 'socket.io'

const io = new Server({
  cors: {
    origin: ['*'],
    methods: ['GET', 'POST'],
  },
})

const connectedUsers = new Map<string, { name: string; socketId: string }>()

io.on('connection', (socket) => {
  console.log(`[pico-chat] connected: ${socket.id}`)

  socket.on('join', (userName: string) => {
    connectedUsers.set(socket.id, { name: userName, socketId: socket.id })
    console.log(`[pico-chat] ${userName} joined`)
    socket.emit('system', { text: `welcome ${userName}`, timestamp: Date.now() })
    io.emit('online-count', connectedUsers.size)
  })

  socket.on('message', (data: { to: string; text: string; from: string; timestamp: number }) => {
    console.log(`[pico-chat] ${data.from} -> ${data.to}: ${data.text}`)

    // Broadcast to target user if online, otherwise echo back as "delivered"
    let delivered = false
    for (const [id, user] of connectedUsers) {
      if (user.name === data.to) {
        io.to(id).emit('message', {
          id: `srv_${Date.now()}`,
          sender: 'them',
          text: data.text,
          from: data.from,
          timestamp: data.timestamp,
        })
        delivered = true
        break
      }
    }

    // Always send delivery confirmation
    socket.emit('delivered', { to: data.to, timestamp: data.timestamp, delivered })
  })

  socket.on('typing', (data: { to: string }) => {
    for (const [id, user] of connectedUsers) {
      if (user.name === data.to) {
        io.to(id).emit('typing', { from: data.to })
        break
      }
    }
  })

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id)
    if (user) {
      console.log(`[pico-chat] ${user.name} disconnected`)
      connectedUsers.delete(socket.id)
      io.emit('online-count', connectedUsers.size)
    }
  })
})

const PORT = 3003
io.listen(PORT)
console.log(`[pico-chat] WebSocket service running on port ${PORT}`)