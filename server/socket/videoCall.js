module.exports = (io) => {
    const rooms = new Map();

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Xử lý khi user bắt đầu cuộc gọi
        socket.on('call-user', ({ userToCall, signalData, from, name }) => {
            io.to(userToCall).emit('incoming-call', {
                signal: signalData,
                from,
                name
            });
        });

        // Xử lý khi user chấp nhận cuộc gọi
        socket.on('answer-call', (data) => {
            io.to(data.to).emit('call-accepted', data.signal);
        });

        // Xử lý khi user từ chối cuộc gọi
        socket.on('reject-call', (data) => {
            io.to(data.from).emit('call-rejected', {
                message: 'Người dùng từ chối cuộc gọi'
            });
        });

        // Xử lý khi user kết thúc cuộc gọi
        socket.on('end-call', (data) => {
            io.to(data.to).emit('call-ended');
        });

        // Xử lý ICE candidates
        socket.on('ice-candidate', ({ candidate, to }) => {
            io.to(to).emit('ice-candidate', candidate);
        });

        // Xử lý khi user disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            // Cleanup rooms
            rooms.forEach((value, key) => {
                if (value === socket.id) {
                    rooms.delete(key);
                }
            });
        });
    });
}; 