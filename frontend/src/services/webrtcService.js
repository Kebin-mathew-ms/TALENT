import { socketService } from './socketService';

export class WebRTCService {
  constructor(sessionId, onRemoteStream) {
    this.sessionId = sessionId;
    this.onRemoteStream = onRemoteStream;
    this.peerConnection = null;
    this.localStream = null;
    this.isAudioMuted = false;
    this.isVideoOff = false;

    // Standard STUN servers configuration
    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
  }

  async getLocalMedia(video = true, audio = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video, audio });
      return { success: true, stream: this.localStream };
    } catch (error) {
      console.warn('⚠️ Camera/Microphone access error:', error.message);
      return { success: false, error: error.message };
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isAudioMuted = !audioTrack.enabled;
        return !this.isAudioMuted;
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.isVideoOff = !videoTrack.enabled;
        return !this.isVideoOff;
      }
    }
    return false;
  }

  createPeerConnection() {
    if (this.peerConnection) return this.peerConnection;

    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle incoming remote tracks
    this.peerConnection.ontrack = (event) => {
      console.log('🎥 WebRTC remote track received');
      if (this.onRemoteStream && event.streams[0]) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emitWebRTCIceCandidate({
          sessionId: this.sessionId,
          candidate: event.candidate,
        });
      }
    };

    return this.peerConnection;
  }

  async createOffer() {
    const pc = this.createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketService.emitWebRTCOffer({
      sessionId: this.sessionId,
      offer,
    });
  }

  async handleOffer(offer) {
    const pc = this.createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketService.emitWebRTCAnswer({
      sessionId: this.sessionId,
      answer,
    });
  }

  async handleAnswer(answer) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async handleIceCandidate(candidate) {
    if (this.peerConnection) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    }
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}
