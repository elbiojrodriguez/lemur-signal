const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);

// ✅✅✅ HEALTH CHECK (ESSENCIAL)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy', 
    service: 'lemur-signal',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: Object.keys(clients || {}).length
  });
});

app.get('/status', (req, res) => {
  res.json({ status: 'OK', service: 'WebRTC Signaling' });
});

// 🌐 Socket.IO
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const clients = {};

io.on('connection', socket => {
  console.log(`🟢 Conectado: ${socket.id}`);

  socket.on('register', uuid => {
    clients[uuid] = socket.id;
    socket.uuid = uuid;
  });

  socket.on('call', ({ to, offer, callerLang }) => {
    const targetSocketId = clients[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('incomingCall', {
        from: socket.uuid,
        offer,
        callerLang
      });
    }
  });

  socket.on('answer', ({ to, answer }) => {
    const targetSocketId = clients[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('acceptAnswer', { answer });
    }
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocketId = clients[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', candidate);
    }
  });

  socket.on('disconnect', () => {
    if (socket.uuid) {
      delete clients[socket.uuid];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor na porta ${PORT}`);
});
