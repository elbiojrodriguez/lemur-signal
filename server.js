const express = require('express');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: {
    origin: 'https://lemur-interface.netlify.app',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const path = require('path');
const clients = {};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log(`⚡ Novo socket conectado: ${socket.id}`);

  socket.on('register', (id) => {
    clients[id] = socket.id;
    console.log(`🔗 ${id} registrado com socket ${socket.id}`);
  });

  socket.on('call', ({ to, offer }) => {
    const receiverSocketId = clients[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('incomingCall', {
        from: socket.id,
        offer
      });
    }
  });

  socket.on('answer', ({ to, answer }) => {
    const callerSocketId = clients[to];
    if (callerSocketId) {
      io.to(callerSocketId).emit('acceptAnswer', { answer });
    }
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocketId = clients[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', candidate);
    }
  });

  socket.on('disconnect', () => {
    for (const id in clients) {
      if (clients[id] === socket.id) {
        delete clients[id];
        console.log(`❌ Desconectado: ${id}`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
