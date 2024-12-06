const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

dotenv.config();
const app = express();
const server = http.createServer(app);

// Cấu hình CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Cấu hình Socket.IO với CORS
const io = socketIO(server, {
    cors: {
        origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const matchRoutes = require('./routes/match');
const messageRoutes = require('./routes/message');
const matchingRoutes = require('./routes/matching');
const videoCallRoutes = require('./routes/videoCall');
const adminRoutes = require('./routes/adminRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/video-call', videoCallRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io connection handling
require('./socket/videoCall')(io);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Serve static files from client directory
app.use('/admin', express.static(path.join(__dirname, '../client/src/pages/Admin')));
app.use(express.static(path.join(__dirname, '../client')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 