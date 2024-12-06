const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();
const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100 // giới hạn mỗi IP 100 request trong 15 phút
});
app.use('/api/', limiter);

// Rate limiting cho API tasks
const tasksLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 50 // giới hạn mỗi IP 50 request trong 1 giờ
});
app.use('/api/tasks/', tasksLimiter);

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

// Body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const matchRoutes = require('./routes/match');
const messageRoutes = require('./routes/message');
const matchingRoutes = require('./routes/matching');
const videoCallRoutes = require('./routes/videoCall');
const adminRoutes = require('./routes/adminRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/video-call', videoCallRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);

// Socket.io connection handling
require('./socket/videoCall')(io);

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Serve static files from client directory
app.use('/admin', express.static(path.join(__dirname, '../client/src/pages/Admin')));
app.use(express.static(path.join(__dirname, '../client')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors });
    }
    
    // MongoDB duplicate key error
    if (err.code === 11000) {
        return res.status(400).json({ message: 'Dữ liệu đã tồn tại' });
    }
    
    // JWT error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token không hợp lệ' });
    }
    
    // Default error
    res.status(500).json({ message: 'Lỗi server' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Không tìm thấy trang' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 