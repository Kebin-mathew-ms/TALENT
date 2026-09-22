import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchAssessmentById } from '../services/assessmentService';
import { startAssessmentSession, endAssessmentSession, fetchSessionDetails } from '../services/sessionService';
import { getAssessmentSubmissions, retryAIEvaluation } from '../services/submissionService';
import { getAssessmentProctoringIncidents } from '../services/proctoringService';
import { socketService } from '../services/socketService';
import { WebRTCService } from '../services/webrtcService';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Square,
  Users,
  Video,
  Code2,
  Clock,
  Radio,
  UserCheck,
  ArrowLeft,
  Tv,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Eye,
} from 'lucide-react';
import '../styles/dashboard.css';

export const InterviewerLiveDashboardPage = () => {
  const { id, sessionId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(sessionId ? parseInt(sessionId, 10) : null);
  const [selectedSessionData, setSelectedSessionData] = useState(null);
  const [liveCode, setLiveCode] = useState('');
  const [activeLanguage, setActiveLanguage] = useState('javascript');
  const [candidateStatuses, setCandidateStatuses] = useState({});

  // Phase 4 Data
  const [proctoringIncidents, setProctoringIncidents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [retryingSubmissions, setRetryingSubmissions] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remoteVideoStream, setRemoteVideoStream] = useState(null);

  const remoteVideoRef = useRef(null);
  const webrtcRef = useRef(null);

  // Load Assessment & Base Data
  const loadAssessmentData = async () => {
    try {
      const response = await fetchAssessmentById(id);
      if (response.success) {
        const ass = response.data;
        setAssessment(ass);
        const candidatesList = ass.candidates || [];

        const initialStatus = {};
        candidatesList.forEach((c) => {
          initialStatus[c.candidateId] = c.status || 'NOT_STARTED';
        });
        setCandidateStatuses(initialStatus);

        if (!selectedSessionId && ass.sessions && ass.sessions.length > 0) {
          setSelectedSessionId(ass.sessions[0].id);
        }

        // Fetch Submissions & Proctoring Incidents for this Assessment
        try {
          const subRes = await getAssessmentSubmissions(id);
          if (subRes.success) setSubmissions(subRes.data);

          const procRes = await getAssessmentProctoringIncidents(id);
          if (procRes.success) setProctoringIncidents(procRes.data);
        } catch (err) {
          console.warn('Error fetching Phase 4 assessment records:', err);
        }
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load live assessment.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessmentData();
  }, [id]);

  // Connect Socket & Join Assessment Room
  useEffect(() => {
    if (!token || !id) return;

    const socket = socketService.connect(token);
    socketService.joinAssessmentRoom(id);

    // Socket Listeners
    socketService.on('candidate:joined', ({ candidateId }) => {
      setCandidateStatuses((prev) => ({ ...prev, [candidateId]: 'CONNECTED' }));
    });

    socketService.on('candidate:left', ({ candidateId }) => {
      setCandidateStatuses((prev) => ({ ...prev, [candidateId]: 'DISCONNECTED' }));
    });

    socketService.on('candidate:completed', ({ candidateId }) => {
      setCandidateStatuses((prev) => ({ ...prev, [candidateId]: 'COMPLETED' }));
    });

    socketService.on('proctoring:alert', (alert) => {
      setProctoringIncidents((prev) => [alert, ...prev]);
    });

    socketService.on('submission:created', (subPayload) => {
      loadAssessmentData();
    });

    socketService.on('evaluation:completed', ({ submissionId, evaluation }) => {
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === submissionId ? { ...sub, status: 'EVALUATED', aiEvaluation: evaluation } : sub))
      );
    });

    return () => {
      socketService.leaveAssessmentRoom(id);
      socketService.off('candidate:joined');
      socketService.off('candidate:left');
      socketService.off('candidate:completed');
      socketService.off('proctoring:alert');
      socketService.off('submission:created');
      socketService.off('evaluation:completed');
    };
  }, [token, id]);

  // When Selected Candidate Session changes
  useEffect(() => {
    if (!selectedSessionId || !token) return;

    setRemoteVideoStream(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    const loadSession = async () => {
      try {
        const res = await fetchSessionDetails(selectedSessionId);
        if (res.success && res.data?.session) {
          setSelectedSessionData(res.data.session);
          setLiveCode(res.data.session.currentCode || '// Waiting for candidate code stream...');
          setActiveLanguage(res.data.session.language || 'javascript');
        }
      } catch (err) {
        console.error('Failed to load session details:', err);
      }
    };

    loadSession();

    socketService.joinSessionRoom(selectedSessionId);

    const handleCodeChanged = ({ sessionId: sId, code, language }) => {
      if (sId === selectedSessionId) {
        setLiveCode(code);
        if (language) setActiveLanguage(language);
      }
    };

    socketService.on('session:code-changed', handleCodeChanged);
    socketService.on('session:state', ({ currentCode, language }) => {
      if (currentCode !== undefined) setLiveCode(currentCode);
      if (language) setActiveLanguage(language);
    });

    // WebRTC Video Handler for Selected Candidate
    webrtcRef.current = new WebRTCService(selectedSessionId, (stream) => {
      setRemoteVideoStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    socketService.on('webrtc:offer', async ({ sessionId: sId, offer }) => {
      if (sId === selectedSessionId && webrtcRef.current) {
        await webrtcRef.current.handleOffer(offer);
      }
    });

    socketService.on('webrtc:ice-candidate', async ({ sessionId: sId, candidate }) => {
      if (sId === selectedSessionId && webrtcRef.current) {
        await webrtcRef.current.handleIceCandidate(candidate);
      }
    });

    return () => {
      socketService.leaveSessionRoom(selectedSessionId);
      socketService.off('session:code-changed', handleCodeChanged);
      socketService.off('session:state');
      socketService.off('webrtc:offer');
      socketService.off('webrtc:ice-candidate');
      if (webrtcRef.current) {
        webrtcRef.current.cleanup();
      }
    };
  }, [selectedSessionId, token]);

  const handleStart = async () => {
    if (window.confirm('Start this live assessment now? Assigned candidates will be notified.')) {
      try {
        const res = await startAssessmentSession(id);
        if (res.success) loadAssessmentData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to start assessment.');
      }
    }
  };

  const handleEnd = async () => {
    if (window.confirm('End this assessment? All active candidate sessions will be completed.')) {
      try {
        const res = await endAssessmentSession(id);
        if (res.success) loadAssessmentData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to end assessment.');
      }
    }
  };

  const handleRetryAI = async (submissionId) => {
    setRetryingSubmissions((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const res = await retryAIEvaluation(submissionId);
      if (res.success) {
        loadAssessmentData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'AI retry failed');
    } finally {
      setRetryingSubmissions((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Live Assessment Monitoring">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Initializing live assessment monitor...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout title="Live Assessment Monitoring">
        <div className="error-banner">
          <span>{error || 'Assessment not found'}</span>
        </div>
      </DashboardLayout>
    );
  }

  const { title, duration, status, candidates = [], sessions = [] } = assessment;
  const isLive = (assessment.dynamicStatus || status) === 'LIVE';
  const isCompleted = (assessment.dynamicStatus || status) === 'COMPLETED';

  return (
    <DashboardLayout title={`Live Control: ${title}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Live Control Header */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{title}</h2>
                <span className={`badge badge-${(assessment.dynamicStatus || status).toLowerCase()}`}>
                  {isLive && <Radio size={14} style={{ animation: 'pulse-badge 1.5s infinite' }} />}
                  {assessment.dynamicStatus || status}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Duration: {duration} mins • Candidates: {candidates.length} • Proctoring Flags: {proctoringIncidents.length}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Link to="/interviewer/proctoring" className="btn-secondary">
                <ShieldAlert size={16} color="#f43f5e" />
                <span>Proctoring Reports</span>
              </Link>

              <Link to="/interviewer/assessments" className="btn-secondary">
                <ArrowLeft size={16} />
                <span>Exit Live View</span>
              </Link>

              {!isLive && !isCompleted && (
                <button className="btn-primary" onClick={handleStart}>
                  <Play size={16} />
                  <span>Start Assessment</span>
                </button>
              )}

              {isLive && (
                <button className="btn-secondary" style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.3)' }} onClick={handleEnd}>
                  <Square size={16} />
                  <span>End Assessment</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Proctoring Alert Ticker */}
        {proctoringIncidents.length > 0 && (
          <div className="section-card" style={{ padding: '0.85rem 1.25rem', borderLeft: '4px solid #f43f5e', background: 'rgba(244,63,94,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.875rem', color: '#f87171' }}>
                <ShieldAlert size={18} />
                <span>Live Proctoring Alerts ({proctoringIncidents.length})</span>
              </div>
              <Link to="/interviewer/proctoring" style={{ fontSize: '0.8rem', color: '#818cf8', textDecoration: 'underline' }}>
                View Full Audit Logs
              </Link>
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {proctoringIncidents.slice(0, 5).map((inc, i) => (
                <div key={inc.id || i} style={{ background: '#0b0f19', padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.775rem', flexShrink: 0 }}>
                  <strong style={{ color: '#fff' }}>{inc.candidateName || 'Candidate'}</strong>: <span style={{ color: '#fbbf24' }}>{inc.eventType}</span> (Warning #{inc.warningNumber})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Candidate Selector Roster */}
        <div className="section-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#818cf8" /> Candidate Multi-Room Roster
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.85rem' }}>
            {candidates.map((c) => {
              const sessionObj = sessions.find((s) => s.candidateId === c.candidateId);
              const isSelected = selectedSessionId === sessionObj?.id;
              const liveStatus = candidateStatuses[c.candidateId] || c.status || 'NOT_STARTED';

              return (
                <div
                  key={c.candidateId}
                  onClick={() => {
                    if (sessionObj) {
                      setSelectedSessionId(sessionObj.id);
                      navigate(`/interviewer/assessments/${id}/live/${sessionObj.id}`);
                    }
                  }}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--primary-light)' : 'var(--bg-input)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.925rem', marginBottom: '0.2rem' }}>
                    {c.candidate?.name}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {c.candidate?.email}
                    </span>
                    <span className="badge badge-candidate" style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem' }}>
                      {liveStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Split View: Live Code & Video Stream */}
        {selectedSessionData && (
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.25rem' }}>
            {/* Read-Only Live Monaco Code Editor */}
            <div className="section-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 480 }}>
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Code2 size={18} color="#38bdf8" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    Live Code Stream — {selectedSessionData.candidate?.name}
                  </span>
                  <span className="badge badge-scheduled" style={{ fontSize: '0.7rem' }}>
                    Read-Only
                  </span>
                </div>

                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  Language: {activeLanguage}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <Editor
                  height="100%"
                  language={activeLanguage.toLowerCase()}
                  value={liveCode}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>

            {/* Candidate Video Feed & AI Submissions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="section-card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Video size={16} color="#34d399" /> Candidate Camera Feed
                </div>

                <div
                  style={{
                    width: '100%',
                    height: 180,
                    background: '#000',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    border: '1px solid var(--border)',
                  }}
                >
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {!remoteVideoStream && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem' }}>
                      Waiting for WebRTC video feed...
                    </div>
                  )}
                </div>
              </div>

              {/* Submissions & AI Scores Summary */}
              <div className="section-card" style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} color="#a855f7" /> Candidate AI Submissions
                </div>

                {submissions.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No submissions recorded yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {submissions.map((sub) => (
                      <div key={sub.id} style={{ background: '#0b0f19', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                            {sub.candidate?.name || 'Candidate'}
                          </span>
                          <span className={`badge badge-${sub.status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                            {sub.status}
                          </span>
                        </div>

                        {sub.aiEvaluation ? (
                          <div style={{ fontSize: '0.775rem' }}>
                            <div style={{ color: '#c084fc', fontWeight: 600 }}>Score: {sub.aiEvaluation.overallScore}/100</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{sub.aiEvaluation.feedback}</div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                            <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Evaluating with Groq AI...</span>
                            <button
                              className="btn-secondary"
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                              onClick={() => handleRetryAI(sub.id)}
                              disabled={retryingSubmissions[sub.id]}
                            >
                              <RotateCcw size={12} />
                              <span>{retryingSubmissions[sub.id] ? 'Retrying...' : 'Retry AI'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
