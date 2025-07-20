const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuração do Socket.IO com CORS ajustado
const io = socketIO(server, {
  cors: {
    origin: '*', // Permite todas as origens (em produção, restrinja para seus domínios)
    methods: ['GET', 'POST']
  }
});

// Mapa de clientes conectados: { uuid: socket.id }
const clients = {};

io.on('connection', socket => {
  console.log(`🟢 Novo socket conectado: ${socket.id}`);

  // Cliente se registra com UUID
  socket.on('register', uuid => {
    clients[uuid] = socket.id;
    socket.uuid = uuid; // salva no próprio socket
    console.log(`🔖 Registrado: ${uuid} -> ${socket.id}`);
  });

  // Cliente envia oferta de chamada para outro
  socket.on('call', ({ to, offer }) => {
    const targetSocketId = clients[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('incomingCall', {
        from: socket.uuid,
        offer
      });
      console.log(`📞 Chamada de ${socket.uuid} para ${to}`);
    } else {
      console.log(`❌ Destinatário ${to} não encontrado`);
    }
  });

  // Cliente envia resposta da chamada
  socket.on('answer', ({ to, answer }) => {
    const targetSocketId = clients[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('acceptAnswer', { answer });
      console.log(`✅ Resposta de ${socket.uuid} para ${to}`);
    }
  });

  // Candidatos ICE
  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocketId = clients[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', candidate);
      console.log(`🧊 ICE candidate de ${socket.uuid} para ${to}`);
    }
  });

  // Quando desconecta
  socket.on('disconnect', () => {
    if (socket.uuid) {
      delete clients[socket.uuid];
      console.log(`🔴 Desconectado: ${socket.uuid}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor de sinalização rodando na porta ${PORT}`);
});
