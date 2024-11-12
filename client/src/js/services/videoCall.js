class VideoCallService {
    constructor() {
        this.socket = io(SOCKET_URL);
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.currentCall = null;

        // ICE servers configuration
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                {
                    urls: process.env.TURN_SERVER,
                    username: process.env.TURN_USERNAME,
                    credential: process.env.TURN_PASSWORD
                }
            ]
        };

        this.initializeSocketListeners();
    }

    async initializeMedia() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }

    initializeSocketListeners() {
        this.socket.on('incoming-call', async (data) => {
            try {
                const stream = await this.initializeMedia();
                document.getElementById('localVideo').srcObject = stream;

                this.currentCall = {
                    from: data.from,
                    name: data.name,
                    signal: data.signal
                };

                this.showIncomingCallModal(data.name);
            } catch (error) {
                console.error('Error handling incoming call:', error);
            }
        });

        this.socket.on('call-accepted', (signal) => {
            this.connectPeer(signal);
        });

        this.socket.on('call-rejected', () => {
            this.endCall();
            alert('Cuộc gọi bị từ chối');
        });

        this.socket.on('call-ended', () => {
            this.endCall();
        });

        this.socket.on('ice-candidate', (candidate) => {
            if (this.peerConnection) {
                this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });
    }

    async startCall(userId, userName) {
        try {
            const stream = await this.initializeMedia();
            document.getElementById('localVideo').srcObject = stream;

            this.peerConnection = new RTCPeerConnection(this.configuration);
            this.setupPeerConnectionHandlers();

            stream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, stream);
            });

            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            this.socket.emit('call-user', {
                userToCall: userId,
                signalData: offer,
                from: this.socket.id,
                name: userName
            });
        } catch (error) {
            console.error('Error starting call:', error);
            throw error;
        }
    }

    async answerCall() {
        try {
            if (!this.currentCall) return;

            this.peerConnection = new RTCPeerConnection(this.configuration);
            this.setupPeerConnectionHandlers();

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
        } catch (error) {
            console.error('Error answering call:', error);
            throw error;
        }
    }

    rejectCall() {
        if (!this.currentCall) return;

        this.socket.emit('reject-call', {
            from: this.currentCall.from
        });

        this.endCall();
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
                to: this.currentCall.from
            });
            this.currentCall = null;
        }

        this.hideVideoCallModal();
    }

    setupPeerConnectionHandlers() {
        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            document.getElementById('remoteVideo').srcObject = this.remoteStream;
        };

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: this.currentCall.from
                });
            }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            if (this.peerConnection.iceConnectionState === 'disconnected') {
                this.endCall();
            }
        };
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
        const modal = document.createElement('div');
        modal.className = 'video-call-modal active';
        modal.innerHTML = `
            <div class="video-container">
                <video id="localVideo" class="video-box" autoplay muted></video>
                <video id="remoteVideo" class="video-box" autoplay></video>
            </div>
            <div class="video-controls">
                <button class="video-control-btn" onclick="videoCallService.toggleAudio()">
                    <i class="btn-icon">🎤</i>
                    <span>Tắt tiếng</span>
                </button>
                <button class="video-control-btn" onclick="videoCallService.toggleVideo()">
                    <i class="btn-icon">📹</i>
                    <span>Tắt camera</span>
                </button>
                <button class="video-control-btn end-call" onclick="videoCallService.endCall()">
                    <i class="btn-icon">📞</i>
                    <span>Kết thúc</span>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showIncomingCallModal(callerName) {
        const modal = document.createElement('div');
        modal.className = 'incoming-call-modal';
        modal.innerHTML = `
            <div class="incoming-call-content">
                <h3>Cuộc gọi đến từ ${callerName}</h3>
                <div class="incoming-call-actions">
                    <button onclick="videoCallService.answerCall()" class="accept-call">
                        <i class="btn-icon">📞</i>
                        Trả lời
                    </button>
                    <button onclick="videoCallService.rejectCall()" class="reject-call">
                        <i class="btn-icon">❌</i>
                        Từ chối
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    hideVideoCallModal() {
        const modal = document.querySelector('.video-call-modal');
        if (modal) modal.remove();
        
        const incomingModal = document.querySelector('.incoming-call-modal');
        if (incomingModal) incomingModal.remove();
    }
}

const videoCallService = new VideoCallService();
export default videoCallService; 