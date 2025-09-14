const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🌐 Configuração do Socket.IO com CORS liberado
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 🗂️ Mapa de clientes conectados: { uuid: socket.id }
const clients = {};

io.on('connection', socket => {
  console.log(`🟢 Novo socket conectado: ${socket.id}`);

  // 🆔 Registro de cliente com UUID
  socket.on('register', uuid => {
    clients[uuid] = socket.id;
    socket.uuid = uuid;
    console.log(`🔖 Registrado: ${uuid} -> ${socket.id}`);
  });

  // 📞 Cliente inicia chamada para outro
  socket.on('call', ({ to, offer, callerLang }) => {
    const targetSocketId = clients[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('incomingCall', {
        from: socket.uuid,
        offer,
        callerLang // ✅ idioma do caller incluído
      });
      console.log(`📞 Chamada de ${socket.uuid} para ${to} com idioma ${callerLang}`);
    } else {
      console.log(`❌ Destinatário ${to} não encontrado`);
    }
  });

  // ✅ Cliente envia resposta da chamada
  socket.on('answer', ({ to, answer }) => {
    const targetSocketId = clients[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('acceptAnswer', { answer });
      console.log(`✅ Resposta de ${socket.uuid} para ${to}`);
    }
  });

  // 🧊 Troca de candidatos ICE
  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocketId = clients[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', candidate);
      console.log(`🧊 ICE candidate de ${socket.uuid} para ${to}`);
    }
  });

  // 🔴 Cliente desconectado
  socket.on('disconnect', () => {
    if (socket.uuid) {
      delete clients[socket.uuid];
      console.log(`🔴 Desconectado: ${socket.uuid}`);
    }
  });
});

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor de sinalização rodando na porta ${PORT}`);
});
