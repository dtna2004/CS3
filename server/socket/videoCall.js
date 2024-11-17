const constants = require('../constants');

module.exports = (io) => {
    // Lưu trữ mapping giữa userId và socketId
    const userSocketMap = new Map();

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Đăng ký userId khi user kết nối
        socket.on('register-user', (userId) => {
            if (userId) {
                console.log('User registered:', userId, 'Socket ID:', socket.id);
                userSocketMap.set(userId, socket.id);
                // Broadcast user online status
                socket.broadcast.emit('user-online', userId);
            }
        });

        socket.on('call-user', async ({ userToCall, signalData, from, name }) => {
            console.log('Call request:', {
                userToCall,
                from,
                name
            });

            const targetSocketId = userSocketMap.get(userToCall);
            console.log('Target socket ID:', targetSocketId);
            console.log('Current socket map:', Array.from(userSocketMap.entries()));

            if (targetSocketId) {
                // Kiểm tra xem socket có thực sự còn kết nối không
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    console.log('Emitting incoming call to:', targetSocketId);
                    io.to(targetSocketId).emit('incoming-call', {
                        signal: signalData,
                        from,
                        name
                    });
                } else {
                    console.log('Socket not connected:', targetSocketId);
                    userSocketMap.delete(userToCall); // Xóa mapping nếu socket không còn kết nối
                    socket.emit('call-failed', { message: 'Người dùng không trực tuyến' });
                }
            } else {
                console.log('User not found in socket map:', userToCall);
                socket.emit('call-failed', { message: 'Người dùng không trực tuyến' });
            }
        });

        // Kiểm tra user online
        socket.on('check-user-online', (userId) => {
            const isOnline = userSocketMap.has(userId);
            socket.emit('user-online-status', { userId, isOnline });
        });

        socket.on('answer-call', (data) => {
            console.log('Call answered by:', socket.id, 'to:', data.to);
            io.to(data.to).emit('call-accepted', {
                signal: data.signal
            });
        });

        socket.on('reject-call', (data) => {
            console.log('Call rejected by:', socket.id);
            io.to(data.to).emit('call-rejected');
        });

        socket.on('ice-candidate', ({ candidate, to }) => {
            const targetSocketId = userSocketMap.get(to);
            if (targetSocketId) {
                io.to(targetSocketId).emit('ice-candidate', candidate);
            }
        });

        socket.on('end-call', (data) => {
            console.log('Call ended by:', socket.id);
            const targetSocketId = userSocketMap.get(data.to);
            if (targetSocketId) {
                io.to(targetSocketId).emit('call-ended');
            }
        });

        socket.on('disconnect', () => {
            // Tìm và xóa userId từ map khi user disconnect
            for (const [userId, socketId] of userSocketMap.entries()) {
                if (socketId === socket.id) {
                    console.log('User disconnected:', userId);
                    userSocketMap.delete(userId);
                    // Broadcast user offline status
                    socket.broadcast.emit('user-offline', userId);
                    break;
                }
            }
        });
    });

    // Thêm method để kiểm tra trạng thái online
    io.isUserOnline = (userId) => {
        const socketId = userSocketMap.get(userId);
        if (socketId) {
            const socket = io.sockets.sockets.get(socketId);
            return !!socket;
        }
        return false;
    };
}; 