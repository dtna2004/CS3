class VideoCallService {
    constructor() {
        if (!this.checkWebRTCSupport()) {
            alert('Trình duyệt của bạn không hỗ trợ cuộc gọi video');
            return;
        }
        if (typeof io === 'undefined') {
            console.error('Socket.IO is not loaded');
            return;
        }
        this.socket = io(window.SOCKET_URL);
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.currentCall = null;

        const userId = localStorage.getItem('userId');
        if (userId) {
            this.socket.emit('register-user', userId);
        }

        this.socket.on('user-online', (userId) => {
            console.log('User online:', userId);
            this.updateUserStatus(userId, true);
        });

        this.socket.on('user-offline', (userId) => {
            console.log('User offline:', userId);
            this.updateUserStatus(userId, false);
        });

        this.socket.on('incoming-call', async (data) => {
            console.log('Incoming call from:', data);
            this.currentCall = data;
            this.showIncomingCallModal(data.name);
        });

        this.socket.on('call-accepted', async (data) => {
            console.log('Call accepted:', data);
            try {
                await this.peerConnection.setRemoteDescription(
                    new RTCSessionDescription(data.signal)
                );
                this.hideWaitingModal();
                this.showVideoCallModal();
            } catch (error) {
                console.error('Error setting remote description:', error);
            }
        });

        this.socket.on('call-rejected', () => {
            alert('Cuộc gọi đã bị từ chối');
            this.hideWaitingModal();
            this.endCall();
        });

        this.socket.on('call-failed', (data) => {
            alert(data.message || 'Không thể kết nối với người dùng');
            this.hideWaitingModal();
            this.endCall();
        });

        this.socket.on('ice-candidate', async (candidate) => {
            try {
                if (this.peerConnection) {
                    await this.peerConnection.addIceCandidate(
                        new RTCIceCandidate(candidate)
                    );
                }
            } catch (error) {
                console.error('Error adding received ice candidate:', error);
            }
        });

        this.socket.on('call-ended', () => {
            alert('Cuộc gọi đã kết thúc');
            this.endCall();
        });
    }

    checkWebRTCSupport() {
        return !!(navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia &&
            window.RTCPeerConnection);
    }

    async getIceServers() {
        try {
            const response = await fetch(`${window.API_URL}/video-call/ice-servers`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to get ICE servers');
            const data = await response.json();
            return data.iceServers;
        } catch (error) {
            console.error('Error getting ICE servers:', error);
            return [{
                urls: [
                    'stun:stun.l.google.com:19302',
                    'stun:stun1.l.google.com:19302'
                ]
            }];
        }
    }

    async getMediaStream(withVideo = true) {
        const constraints = {
            audio: true,
            video: withVideo ? {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } : false
        };

        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            console.error('Media error:', error);
            
            if (error.name === 'NotAllowedError') {
                throw new Error('Vui lòng cho phép truy cập camera và microphone');
            } else if (error.name === 'NotFoundError') {
                throw new Error('Không tìm thấy camera hoặc microphone');
            } else if (error.name === 'NotReadableError') {
                throw new Error('Camera hoặc microphone đang được sử dụng bởi ứng dụng khác');
            } else {
                throw error;
            }
        }
    }

    async initializePeerConnection() {
        try {
            const iceServers = await this.getIceServers();
            this.peerConnection = new RTCPeerConnection({ iceServers });
            
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('ice-candidate', {
                        candidate: event.candidate,
                        to: this.currentCall?.to || this.currentCall?.from
                    });
                }
            };

            this.peerConnection.ontrack = (event) => {
                this.remoteStream = event.streams[0];
                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) {
                    remoteVideo.srcObject = this.remoteStream;
                }
            };

            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', this.peerConnection.iceConnectionState);
                if (this.peerConnection.iceConnectionState === 'disconnected') {
                    this.endCall();
                }
            };

            this.peerConnection.onicegatheringstatechange = () => {
                console.log('ICE gathering state:', this.peerConnection.iceGatheringState);
            };

            this.peerConnection.onsignalingstatechange = () => {
                console.log('Signaling state:', this.peerConnection.signalingState);
            };
        } catch (error) {
            console.error('Error initializing peer connection:', error);
            throw new Error('Không thể khởi tạo kết nối');
        }
    }

    async startCall(userId, userName) {
        try {
            const isOnline = await this.checkUserOnline(userId);
            if (!isOnline) {
                alert('Người dùng hiện không trực tuyến');
                return;
            }

            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: true
                });
            } catch (mediaError) {
                console.error('Media error:', mediaError);
                // Thử lại với độ phân giải thấp hơn
                try {
                    this.localStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 640 },
                            height: { ideal: 480 }
                        },
                        audio: true
                    });
                } catch (fallbackError) {
                    // Nếu vẫn lỗi, thử chỉ với audio
                    if (confirm('Không thể truy cập camera. Bạn có muốn tiếp tục với cuộc gọi âm thanh?')) {
                        this.localStream = await navigator.mediaDevices.getUserMedia({
                            video: false,
                            audio: true
                        });
                    } else {
                        throw new Error('Không thể truy cập thiết bị media');
                    }
                }
            }
            
            document.getElementById('localVideo').srcObject = this.localStream;
            
            await this.initializePeerConnection();

            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            this.currentCall = {
                to: userId,
                from: this.socket.id,
                name: userName
            };

            this.socket.emit('call-user', {
                userToCall: userId,
                signalData: offer,
                from: this.socket.id,
                name: userName
            });

            this.showWaitingModal();
        } catch (error) {
            console.error('Error starting call:', error);
            alert('Không thể bắt đầu cuộc gọi: ' + error.message);
            this.endCall();
        }
    }

    async answerCall() {
        try {
            if (!this.currentCall) return;

            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: true
                });
            } catch (mediaError) {
                console.error('Media error:', mediaError);
                // Thử lại với độ phân giải thấp hơn
                try {
                    this.localStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 640 },
                            height: { ideal: 480 }
                        },
                        audio: true
                    });
                } catch (fallbackError) {
                    // Nếu vẫn lỗi, thử chỉ với audio
                    if (confirm('Không thể truy cập camera. Bạn có muốn tiếp tục với cuộc gọi âm thanh?')) {
                        this.localStream = await navigator.mediaDevices.getUserMedia({
                            video: false,
                            audio: true
                        });
                    } else {
                        throw new Error('Không thể truy cập thiết bị media');
                    }
                }
            }
            
            document.getElementById('localVideo').srcObject = this.localStream;
            
            await this.initializePeerConnection();

            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            await this.peerConnection.setRemoteDescription(
                new RTCSessionDescription(this.currentCall.signal)
            );

            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            this.socket.emit('answer-call', {
                signal: answer,
                to: this.currentCall.from
            });

            this.hideIncomingCallModal();
            this.showVideoCallModal();
        } catch (error) {
            console.error('Error answering call:', error);
            alert('Không thể trả lời cuộc gọi: ' + error.message);
            this.endCall();
        }
    }

    rejectCall() {
        if (!this.currentCall) return;

        this.socket.emit('reject-call', {
            to: this.currentCall.from
        });

        this.hideIncomingCallModal();
        this.currentCall = null;
    }

    endCall() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
            this.remoteStream = null;
        }

        document.getElementById('localVideo').srcObject = null;
        document.getElementById('remoteVideo').srcObject = null;

        if (this.currentCall) {
            this.socket.emit('end-call', {
                to: this.currentCall.from || this.currentCall.to
            });
            this.currentCall = null;
        }

        this.hideVideoCallModal();
    }

    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return false;
    }

    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return false;
    }

    showVideoCallModal() {
        const modal = document.getElementById('videoCallModal');
        if (modal) {
            modal.style.display = 'flex';
            const statusDiv = document.createElement('div');
            statusDiv.id = 'callStatus';
            statusDiv.className = 'call-status';
            statusDiv.textContent = 'Đang kết nối...';
            modal.appendChild(statusDiv);
        }
    }

    hideVideoCallModal() {
        const modal = document.getElementById('videoCallModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showIncomingCallModal(callerName) {
        const modal = document.getElementById('incomingCallModal');
        const callerNameSpan = document.getElementById('callerName');
        if (modal && callerNameSpan) {
            callerNameSpan.textContent = callerName;
            modal.style.display = 'flex';
        }
    }

    hideIncomingCallModal() {
        const modal = document.getElementById('incomingCallModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showWaitingModal() {
        const modal = document.getElementById('waitingCallModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideWaitingModal() {
        const modal = document.getElementById('waitingCallModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async checkUserOnline(userId) {
        return new Promise((resolve) => {
            this.socket.emit('check-user-online', userId);
            this.socket.once('user-online-status', (data) => {
                resolve(data.isOnline);
            });
        });
    }

    updateUserStatus(userId, isOnline) {
        const statusElement = document.querySelector(`[data-user-id="${userId}"] .user-status`);
        if (statusElement) {
            statusElement.textContent = isOnline ? 'Trực tuyến' : 'Không trực tuyến';
            statusElement.classList.toggle('online', isOnline);
        }
    }

    updateCallStatus(message) {
        const statusDiv = document.getElementById('callStatus');
        if (statusDiv) {
            statusDiv.textContent = message;
        }
    }
}

window.videoCallService = new VideoCallService(); 