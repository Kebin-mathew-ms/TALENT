import React, { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/socketService';
import { WebRTCService } from '../services/webrtcService';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Send,
  Users,
  MessageSquare,
  X,
  Radio,
  ShieldAlert,
  Sparkles,
  Maximize2,
  Tv,
  Bell,
} from 'lucide-react';

export const LiveExamMeetingModal = ({
  assessment,
  candidates = [],
  sessions = [],
  candidateStatuses = {},
  onClose,
  onSelectCandidate,
}) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAdminBroadcasting, setIsAdminBroadcasting] = useState(false);
  const [isAdminAudioMuted, setIsAdminAudioMuted] = useState(false);
  const [adminVideoStream, setAdminVideoStream] = useState(null);

  const adminVideoRef = useRef(null);
  const adminMediaStreamRef = useRef(null);
  const chatScrollRef = useRef(null);

  const assessmentId = assessment?.id;

  // Initialize Socket Chat & Listeners for Assessment Room
  useEffect(() => {
    if (!assessmentId) return;

    // Join Assessment Room & fetch chat history
    socketService.joinAssessmentRoom(assessmentId);
    socketService.fetchChatHistory(assessmentId);

    const handleChatHistory = ({ messages }) => {
      setChatMessages(messages || []);
    };

    const handleChatMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    socketService.on('chat:history', handleChatHistory);
    socketService.on('chat:message', handleChatMessage);

    return () => {
      socketService.off('chat:history', handleChatHistory);
      socketService.off('chat:message', handleChatMessage);
    };
  }, [assessmentId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const adminPeerConnectionRef = useRef(null);

  // Auto-attach admin video stream to video element when mounted
  useEffect(() => {
    if (adminVideoRef.current && adminVideoStream) {
      adminVideoRef.current.srcObject = adminVideoStream;
    }
  }, [adminVideoStream, isAdminBroadcasting]);

  // Listen for WebRTC answer signals from candidates
  useEffect(() => {
    const handleAdminAnswer = async ({ answer }) => {
      if (adminPeerConnectionRef.current) {
        try {
          await adminPeerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error('Error setting remote description from candidate:', e);
        }
      }
    };

    const handleAdminIce = async ({ candidate }) => {
      if (adminPeerConnectionRef.current && candidate) {
        try {
          await adminPeerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }
    };

    socketService.on('admin:answer', handleAdminAnswer);
    socketService.on('admin:ice-candidate', handleAdminIce);

    return () => {
      socketService.off('admin:answer', handleAdminAnswer);
      socketService.off('admin:ice-candidate', handleAdminIce);
    };
  }, []);

  const startAdminWebRTCOffer = async (stream) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      adminPeerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.emitAdminIceCandidate({ assessmentId, candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketService.emitAdminOffer({ assessmentId, offer });
    } catch (err) {
      console.error('Error starting admin WebRTC broadcast offer:', err);
    }
  };

  // Toggle Admin Camera Broadcast
  const toggleAdminVideoBroadcast = async () => {
    if (!isAdminBroadcasting) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        adminMediaStreamRef.current = stream;
        setAdminVideoStream(stream);
        setIsAdminBroadcasting(true);
        socketService.broadcastAdminStream({ assessmentId, isBroadcasting: true });

        await startAdminWebRTCOffer(stream);
      } catch (err) {
        alert('Could not access Admin camera/microphone: ' + err.message);
      }
    } else {
      if (adminPeerConnectionRef.current) {
        adminPeerConnectionRef.current.close();
        adminPeerConnectionRef.current = null;
      }
      if (adminMediaStreamRef.current) {
        adminMediaStreamRef.current.getTracks().forEach((track) => track.stop());
        adminMediaStreamRef.current = null;
      }
      setAdminVideoStream(null);
      setIsAdminBroadcasting(false);
      socketService.broadcastAdminStream({ assessmentId, isBroadcasting: false });
    }
  };

  const toggleAdminAudio = () => {
    if (adminMediaStreamRef.current) {
      const audioTrack = adminMediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAdminAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Send Chat Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !assessmentId) return;

    socketService.sendChatMessage({
      assessmentId,
      text: inputMessage.trim(),
    });

    setInputMessage('');
  };

  // Quick Announcement Trigger
  const sendAnnouncement = (presetText) => {
    if (!assessmentId) return;
    socketService.sendChatMessage({
      assessmentId,
      text: `📢 ANNOUNCEMENT: ${presetText}`,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 16, 0.94)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(56,189,248,0.2) 100%)',
              border: '1px solid rgba(99,102,241,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Tv size={20} color="#818cf8" />
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
              Live Exam Meeting Room
            </span>
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {assessment?.title} • <span style={{ color: '#34d399', fontWeight: 700 }}>{candidates.length} Candidates Enrolled</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={toggleAdminVideoBroadcast}
            className="btn-primary"
            style={{
              background: isAdminBroadcasting
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
            }}
          >
            {isAdminBroadcasting ? <VideoOff size={16} /> : <Video size={16} />}
            <span>{isAdminBroadcasting ? 'Stop Admin Broadcast' : 'Broadcast Admin Video'}</span>
          </button>

          {isAdminBroadcasting && (
            <button
              onClick={toggleAdminAudio}
              className="btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
            >
              {isAdminAudioMuted ? <MicOff size={16} color="#f43f5e" /> : <Mic size={16} color="#34d399" />}
              <span>{isAdminAudioMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
            title="Exit Meeting View"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Grid: Multi-Candidate Video Stream + Live Chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.25rem', flex: 1, minHeight: 0 }}>
        {/* Left Column: Video Tile Grid */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            overflowY: 'auto',
            paddingRight: '0.5rem',
          }}
        >
          {/* Admin Self Stream Preview Tile (If Broadcasting) */}
          {isAdminBroadcasting && (
            <div
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '2px solid var(--primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: 160,
                  height: 100,
                  background: '#000',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <video
                  ref={adminVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    background: 'rgba(239,68,68,0.85)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: 4,
                  }}
                >
                  LIVE BROADCAST
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Admin Camera Broadcast Active</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Your live video feed is currently being transmitted to all candidates in this exam session.
                </p>
              </div>
            </div>
          )}

          {/* Candidate Multi-Video Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {candidates.map((c) => {
              const sessionObj = sessions.find((s) => s.candidateId === c.candidateId);
              const liveStatus = candidateStatuses[c.candidateId] || c.status || 'NOT_STARTED';

              return (
                <div
                  key={c.candidateId}
                  className="section-card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    position: 'relative',
                  }}
                >
                  {/* Video Box Header */}
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-surface)',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                      {c.candidate?.name || 'Candidate'}
                    </span>
                    <span className="badge badge-candidate" style={{ fontSize: '0.65rem' }}>
                      {liveStatus}
                    </span>
                  </div>

                  {/* Video Stream Area */}
                  <div
                    style={{
                      height: 180,
                      background: '#040711',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                      <Video size={28} style={{ opacity: 0.4, marginBottom: '0.4rem' }} />
                      <div style={{ fontSize: '0.75rem' }}>{c.candidate?.name}</div>
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: 2 }}>
                        {liveStatus === 'CONNECTED' ? 'WebRTC Stream Ready' : 'Waiting for connection...'}
                      </div>
                    </div>

                    {/* Quick Switch Button Overlay */}
                    {sessionObj && (
                      <button
                        onClick={() => {
                          onSelectCandidate(sessionObj.id);
                          onClose();
                        }}
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          background: 'rgba(99,102,241,0.85)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Maximize2 size={12} /> View Code & Focus
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Real-Time Exam Group Chat */}
        <div
          className="section-card"
          style={{
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
              <MessageSquare size={18} color="#38bdf8" /> Live Exam Group Chat
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{chatMessages.length} Messages</span>
          </div>

          {/* Preset Announcement Buttons */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(99,102,241,0.05)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
            }}
          >
            <button
              onClick={() => sendAnnouncement('Welcome! Please keep your webcam and mic enabled.')}
              style={{
                fontSize: '0.675rem',
                padding: '0.2rem 0.5rem',
                borderRadius: 4,
                background: 'rgba(99,102,241,0.2)',
                color: '#a5b4fc',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              📢 Welcome
            </button>

            <button
              onClick={() => sendAnnouncement('10 Minutes remaining! Please review your final submissions.')}
              style={{
                fontSize: '0.675rem',
                padding: '0.2rem 0.5rem',
                borderRadius: 4,
                background: 'rgba(251,191,36,0.2)',
                color: '#fde047',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⏰ 10 Mins Left
            </button>
          </div>

          {/* Chat Messages Feed */}
          <div
            ref={chatScrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No messages yet. Send an announcement or chat with candidates!
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isAdmin = msg.sender?.role === 'INTERVIEWER';
                return (
                  <div
                    key={msg.id || Math.random()}
                    style={{
                      background: isAdmin ? 'rgba(99,102,241,0.15)' : 'var(--bg-input)',
                      border: isAdmin ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.825rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.775rem',
                          color: isAdmin ? '#a5b4fc' : '#38bdf8',
                        }}
                      >
                        {msg.sender?.name || 'User'} {isAdmin && '(Admin)'}
                      </span>
                      <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ color: '#fff', lineHeight: 1.4 }}>{msg.text}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '0.75rem',
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Type message to all candidates..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.75rem' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.45rem 0.85rem' }}>
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
