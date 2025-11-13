const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const connection = require('./db_config');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');

const uploadDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api', (req, res, next) => {
  req.upload = upload;
  next();
});
app.use('/api', profileRoutes);

const port = 3000;
const connectedUsers = {};

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  socket.on('join', (userId) => {
    if (!userId) {
      socket.emit('auth_error', 'Não autenticado');
      return;
    }

    connectedUsers[socket.id] = userId;
    socket.join(`user_${userId}`);

    const query = 'SELECT id, name, email, profile_picture, bio, created_at FROM users WHERE id = ?';
    connection.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        socket.emit('user_data', { success: false, message: 'Erro ao carregar perfil' });
        return;
      }
      if (results && results.length > 0) {
        socket.emit('user_data', { success: true, user: results[0] });
      } else {
        socket.emit('user_data', { success: false, message: 'Usuário não encontrado' });
      }
    });

    console.log(`Usuário ${userId} conectado`);
  });

  socket.on('profile_updated', (data) => {
    const userId = connectedUsers[socket.id];
    if (userId) {
      io.to(`user_${userId}`).emit('profile_changed', { success: true, user: data });
    }
  });

  socket.on('user_status', (status) => {
    const userId = connectedUsers[socket.id];
    if (userId) {
      io.emit('user_status_changed', {
        userId: userId,
        status: status,
        timestamp: new Date()
      });
    }
  });

  socket.on('send_notification', (data) => {
    const fromUserId = connectedUsers[socket.id];
    if (fromUserId) {
      io.to(`user_${data.toUserId}`).emit('notification', {
        from: fromUserId,
        message: data.message,
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    const userId = connectedUsers[socket.id];
    delete connectedUsers[socket.id];
    
    if (userId) {
      io.emit('user_status_changed', {
        userId: userId,
        status: 'offline',
        timestamp: new Date()
      });
      console.log(`Usuário ${userId} desconectado`);
    }
  });
});

server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Socket.io ativo em http://localhost:${port}`);
});
