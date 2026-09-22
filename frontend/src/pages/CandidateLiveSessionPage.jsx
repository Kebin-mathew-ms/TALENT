import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getOrCreateCandidateSession, fetchSessionDetails, saveSessionCheckpoint, completeAssessmentSession } from '../services/sessionService';
import { runCode } from '../services/executionService';
import { submitCode, getSessionSubmissions } from '../services/submissionService';
import { logProctoringIncident } from '../services/proctoringService';
import { socketService } from '../services/socketService';
import { WebRTCService } from '../services/webrtcService';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  Code2,
  Play,
  Send,
  Wifi,
  WifiOff,
  Video,
  Mic,
  MicOff,
  VideoOff,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Terminal,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import '../styles/dashboard.css';

export const CandidateLiveSessionPage = () => {
  const { id: assessmentId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState('');
  const [codeMap, setCodeMap] = useState({});
  const [language, setLanguage] = useState('javascript');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isConnected, setIsConnected] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Execution & Submission state
  const [terminalOutput, setTerminalOutput] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [latestEvaluation, setLatestEvaluation] = useState(null);

  // Proctoring State
  const [proctoringIncidents, setProctoringIncidents] = useState([]);
  const [activeWarning, setActiveWarning] = useState(null);

  // Media state
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const webrtcRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const lastBlurTimeRef = useRef(0);

  // Initialize Candidate Session
  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionRes = await getOrCreateCandidateSession(assessmentId);
        if (sessionRes.success && sessionRes.data) {
          const sObj = sessionRes.data;
          setSession(sObj);

          // Fetch full session details including questions & timer
          const detailsRes = await fetchSessionDetails(sObj.id);
          if (detailsRes.success) {
            const { session: fullSession, timer } = detailsRes.data;
            const qList = fullSession.assessment?.questions?.map((qItem) => qItem.question) || [];
            setQuestions(qList);
            setTimerSeconds(timer.remainingSeconds);

            // Per-question code map initialized with unique templates
            const initialMap = {};
            qList.forEach((q) => {
              initialMap[q.id] = `// Write your solution for: ${q.title}\n\nfunction solution() {\n  // Your code here\n}\n`;
            });

            // Parse server-stored JSON codeMap if available
            if (fullSession.currentCode) {
              try {
                const parsed = JSON.parse(fullSession.currentCode);
                if (typeof parsed === 'object' && parsed !== null) {
                  Object.assign(initialMap, parsed);
                }
              } catch (e) {
                if (qList.length > 0) {
                  initialMap[qList[0].id] = fullSession.currentCode;
                }
              }
            }

            // Fetch past submissions and populate submitted code per question
            try {
              const subRes = await getSessionSubmissions(sObj.id);
              if (subRes.success && subRes.data) {
                setSubmissions(subRes.data);
                if (subRes.data.length > 0 && subRes.data[0].aiEvaluation) {
                  setLatestEvaluation(subRes.data[0].aiEvaluation);
                }
                subRes.data.forEach((sub) => {
                  if (sub.questionId && sub.code) {
                    initialMap[sub.questionId] = sub.code;
                  }
                });
              }
            } catch (err) {
              console.warn('Could not fetch past submissions:', err);
            }

            setCodeMap(initialMap);

            let initialIdx = 0;
            if (fullSession.currentQuestionId && qList.length > 0) {
              const idx = qList.findIndex((q) => q.id === fullSession.currentQuestionId);
              if (idx !== -1) initialIdx = idx;
            }
            setCurrentQuestionIndex(initialIdx);

            if (qList[initialIdx]) {
              const activeQId = qList[initialIdx].id;
              setCode(initialMap[activeQId] || `// Write your solution for: ${qList[initialIdx].title}\n\nfunction solution() {\n  // Your code here\n}\n`);
            }
          }
        } else {
          setError(sessionRes.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize assessment session.');
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [assessmentId]);

  // Connect Socket & Join Session Room
  useEffect(() => {
    if (!token || !session?.id) return;

    const socket = socketService.connect(token);
    socketService.joinSessionRoom(session.id);
    setIsConnected(true);

    socketService.on('disconnect', () => setIsConnected(false));
    socketService.on('connect', () => setIsConnected(true));

    // Listen for AI Evaluation updates
    socketService.on('evaluation:completed', ({ evaluation, submissionId }) => {
      setLatestEvaluation(evaluation);
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === submissionId ? { ...sub, status: 'EVALUATED', aiEvaluation: evaluation } : sub))
      );
    });

    socketService.on('evaluation:failed', ({ submissionId, error }) => {
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === submissionId ? { ...sub, status: 'FAILED' } : sub))
      );
    });

    // WebRTC Signaling Handlers
    webrtcRef.current = new WebRTCService(session.id);
    webrtcRef.current.getLocalMedia().then(({ stream }) => {
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

    socketService.on('webrtc:peer-ready', async () => {
      if (webrtcRef.current) {
        await webrtcRef.current.createOffer();
      }
    });

    socketService.on('webrtc:answer', async ({ answer }) => {
      if (webrtcRef.current) {
        await webrtcRef.current.handleAnswer(answer);
      }
    });

    socketService.on('webrtc:ice-candidate', async ({ candidate }) => {
      if (webrtcRef.current) {
        await webrtcRef.current.handleIceCandidate(candidate);
      }
    });

    return () => {
      socketService.leaveSessionRoom(session.id);
      socketService.off('disconnect');
      socketService.off('connect');
      socketService.off('evaluation:completed');
      socketService.off('evaluation:failed');
      socketService.off('webrtc:peer-ready');
      socketService.off('webrtc:answer');
      socketService.off('webrtc:ice-candidate');
      if (webrtcRef.current) webrtcRef.current.cleanup();
    };
  }, [token, session?.id]);

  // Automated Proctoring Event Listeners (Tab Switch & Window Blur)
  useEffect(() => {
    if (!session?.id) return;

    const handleIncidentTrigger = async (eventType, details) => {
      const now = Date.now();
      // Debounce window blur events within 2 seconds
      if (now - lastBlurTimeRef.current < 2000) return;
      lastBlurTimeRef.current = now;

      try {
        const res = await logProctoringIncident({
          sessionId: session.id,
          eventType,
          details
        });

        if (res.success && res.data) {
          const inc = res.data;
          setProctoringIncidents((prev) => [inc, ...prev]);
          setActiveWarning({
            warningNumber: inc.warningNumber,
            eventType: inc.eventType,
            message: `Warning #${inc.warningNumber}: ${eventType === 'TAB_SWITCH' ? 'Tab switch detected!' : 'Window lost focus!'} Please keep your focus on the assessment window.`
          });
        }
      } catch (err) {
        console.error('Failed to log proctoring incident:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleIncidentTrigger('TAB_SWITCH', { url: window.location.href, timestamp: new Date().toISOString() });
      }
    };

    const handleWindowBlur = () => {
      handleIncidentTrigger('WINDOW_BLUR', { timestamp: new Date().toISOString() });
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [session?.id]);

  // Server-Synced Countdown Timer
  useEffect(() => {
    if (timerSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          alert('Time limit reached! Your assessment code will be saved.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSeconds]);

  // Monaco Code Change Handler
  const handleCodeChange = (newCode) => {
    setCode(newCode);

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const updatedMap = { ...codeMap, [currentQ.id]: newCode };
    setCodeMap(updatedMap);

    if (session?.id) {
      socketService.emitCodeChanged({
        sessionId: session.id,
        code: newCode,
        language,
        questionId: currentQ.id,
      });

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveSessionCheckpoint(session.id, {
          currentCode: JSON.stringify(updatedMap),
          currentQuestionId: currentQ.id,
          language,
        });
      }, 2000);
    }
  };

  // Question Navigation
  const handleQuestionChange = (index) => {
    if (index < 0 || index >= questions.length) return;
    const targetQ = questions[index];
    if (!targetQ) return;

    setCurrentQuestionIndex(index);
    setTerminalOutput(null);

    const targetCode = codeMap[targetQ.id] || `// Write your solution for: ${targetQ.title}\n\nfunction solution() {\n  // Your code here\n}\n`;
    setCode(targetCode);

    if (session?.id) {
      socketService.emitQuestionChanged({
        sessionId: session.id,
        questionId: targetQ.id,
      });

      saveSessionCheckpoint(session.id, {
        currentCode: JSON.stringify(codeMap),
        currentQuestionId: targetQ.id,
        language,
      });
    }
  };

  // Run Code Execution Handler (Secure Child Process)
  const handleRunCode = async () => {
    if (!code) return;
    setIsRunningCode(true);
    setTerminalOutput({ status: 'RUNNING', message: 'Executing code in isolated sandbox...' });

    try {
      const res = await runCode({
        sessionId: session?.id,
        questionId: questions[currentQuestionIndex]?.id,
        language,
        code
      });

      if (res.success) {
        setTerminalOutput(res.data);
      } else {
        setTerminalOutput({
          status: 'ERROR',
          stderr: res.error || 'Execution failed'
        });
      }
    } catch (err) {
      setTerminalOutput({
        status: 'ERROR',
        stderr: err.response?.data?.error || 'Execution service error'
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  // Submit Code Solution for current question & trigger AI Evaluation
  const handleSingleSubmission = async () => {
    if (!code) return;
    setIsSubmitting(true);
    try {
      const res = await submitCode({
        sessionId: session.id,
        questionId: questions[currentQuestionIndex]?.id,
        code,
        language,
        executionResult: terminalOutput
      });

      if (res.success) {
        const sub = res.data;
        setSubmissions((prev) => [sub, ...prev]);
        setTerminalOutput({
          status: 'SUBMITTED',
          stdout: `Solution submitted successfully! AI evaluation pipeline triggered.`
        });
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit solution');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Audio / Video
  const handleToggleAudio = () => {
    if (webrtcRef.current) {
      const active = webrtcRef.current.toggleAudio();
      setIsAudioMuted(!active);
      if (!active) {
        logProctoringIncident({ sessionId: session?.id, eventType: 'MICROPHONE_DISABLED', details: 'Microphone turned off by candidate' });
      }
    }
  };

  const handleToggleVideo = () => {
    if (webrtcRef.current) {
      const active = webrtcRef.current.toggleVideo();
      setIsVideoOff(!active);
      if (!active) {
        logProctoringIncident({ sessionId: session?.id, eventType: 'CAMERA_DISABLED', details: 'Camera feed turned off by candidate' });
      }
    }
  };

  // Submit Final Assessment
  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    try {
      // Create final submission snapshot
      await submitCode({
        sessionId: session.id,
        questionId: questions[currentQuestionIndex]?.id,
        code,
        language,
        executionResult: terminalOutput
      }).catch(() => {});

      const res = await completeAssessmentSession(session.id, { finalCode: code });
      if (res.success) {
        setShowConfirmModal(false);
        navigate('/candidate/dashboard');
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer format (MM:SS)
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#94a3b8' }}>
        Loading assessment coding room...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', padding: '2rem' }}>
        <div className="error-banner" style={{ maxWidth: 500 }}>
          <AlertCircle size={20} />
          <span>{error || 'Unable to load assessment session.'}</span>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0b0f19', color: '#f8fafc' }}>
      {/* Active Proctoring Alert Modal Banner */}
      {activeWarning && (
        <div
          style={{
            background: 'linear-gradient(90deg, #991b1b, #7f1d1d)',
            color: '#fef2f2',
            padding: '0.65rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #ef4444',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <AlertTriangle size={20} color="#fca5a5" />
            <span>{activeWarning.message}</span>
          </div>
          <button
            onClick={() => setActiveWarning(null)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              padding: '0.2rem 0.6rem',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Assessment Top Header */}
      <header
        style={{
          height: 60,
          background: '#131b2e',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="brand-icon" style={{ width: 32, height: 32 }}>
            <Code2 size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
            {session.assessment?.title || 'Technical Assessment'}
          </span>
        </div>

        {/* Server-Synced Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '1rem',
            color: timerSeconds < 300 ? '#f43f5e' : '#818cf8',
          }}
        >
          <Clock size={16} />
          <span>{formatTimer(timerSeconds)}</span>
        </div>

        {/* Connection Status & Submit Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: isConnected ? '#34d399' : '#f43f5e' }}>
            {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isConnected ? '● Connected' : '● Reconnecting...'}</span>
          </span>

          <button className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }} onClick={() => setShowConfirmModal(true)}>
            <Send size={15} />
            <span>Finish & Submit Assessment</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Split Layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.3fr', height: 'calc(100vh - 120px)' }}>
        {/* Left Panel: Question Navigator, Description & AI Evaluation */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: '#131b2e' }}>
          {/* Question Navigator Bar */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto' }}>
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => handleQuestionChange(idx)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: currentQuestionIndex === idx ? 'var(--primary)' : 'var(--bg-input)',
                  color: currentQuestionIndex === idx ? '#fff' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>

          {/* Problem Details */}
          {currentQ ? (
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Q{currentQuestionIndex + 1}. {currentQ.title}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: currentQ.difficulty === 'EASY' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: currentQ.difficulty === 'EASY' ? '#34d399' : '#fbbf24',
                    fontWeight: 600,
                  }}
                >
                  {currentQ.difficulty}
                </span>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '1.25rem' }}>
                {currentQ.description}
              </div>

              {currentQ.expectedOutput && (
                <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Expected Output Sample
                  </div>
                  <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#818cf8' }}>
                    {currentQ.expectedOutput}
                  </pre>
                </div>
              )}

              {/* Real-time AI Evaluation Results Card */}
              {latestEvaluation && (
                <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Sparkles size={18} color="#a855f7" />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#c084fc' }}>
                      AI Code Assessment Card
                    </span>
                    <span className="badge badge-evaluated" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                      Overall: {latestEvaluation.overallScore}/100
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>
                    <div style={{ background: '#0b0f19', padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Correct</div>
                      <div style={{ fontWeight: 700, color: '#34d399' }}>{latestEvaluation.correctnessScore}</div>
                    </div>
                    <div style={{ background: '#0b0f19', padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Quality</div>
                      <div style={{ fontWeight: 700, color: '#38bdf8' }}>{latestEvaluation.qualityScore}</div>
                    </div>
                    <div style={{ background: '#0b0f19', padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Speed</div>
                      <div style={{ fontWeight: 700, color: '#fbbf24' }}>{latestEvaluation.efficiencyScore}</div>
                    </div>
                    <div style={{ background: '#0b0f19', padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Logic</div>
                      <div style={{ fontWeight: 700, color: '#c084fc' }}>{latestEvaluation.problemSolvingScore}</div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                    {latestEvaluation.feedback}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>No questions in this assessment.</div>
          )}

          {/* WebRTC Candidate Video Stream Preview Box */}
          <div style={{ padding: '0.85rem', borderTop: '1px solid var(--border)', background: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 70, height: 50, background: '#000', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Camera Feed</span>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button className="btn-secondary" style={{ padding: '0.35rem 0.5rem' }} onClick={handleToggleAudio}>
                {isAudioMuted ? <MicOff size={16} color="#f43f5e" /> : <Mic size={16} />}
              </button>
              <button className="btn-secondary" style={{ padding: '0.35rem 0.5rem' }} onClick={handleToggleVideo}>
                {isVideoOff ? <VideoOff size={16} color="#f43f5e" /> : <Video size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Monaco Editor & Interactive Execution Terminal */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#0b0f19' }}>
          {/* Editor Header Bar */}
          <div style={{ padding: '0.5rem 1rem', background: '#131b2e', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Monaco Code Editor
            </span>

            <select className="form-input" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>

          {/* Monaco Editor Component */}
          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language={language.toLowerCase()}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Bottom Execution Terminal & Controls */}
          <div style={{ height: 160, borderTop: '1px solid var(--border)', background: '#131b2e', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                <Terminal size={14} /> Output Console
              </div>

              {terminalOutput && (
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: terminalOutput.status === 'SUCCESS' ? '#34d399' : (terminalOutput.status === 'TIMEOUT' ? '#fbbf24' : '#f43f5e') }}>
                  Status: {terminalOutput.status} {terminalOutput.executionTimeMs ? `(${terminalOutput.executionTimeMs}ms)` : ''}
                </div>
              )}
            </div>

            {/* Terminal Body */}
            <div style={{ flex: 1, background: '#0b0f19', borderRadius: 6, border: '1px solid var(--border)', padding: '0.5rem 0.75rem', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              {isRunningCode ? (
                <div style={{ color: '#818cf8' }}>Executing code in isolated child process...</div>
              ) : terminalOutput ? (
                <div>
                  {terminalOutput.stdout && (
                    <div style={{ color: '#34d399', whiteSpace: 'pre-wrap' }}>{terminalOutput.stdout}</div>
                  )}
                  {terminalOutput.stderr && (
                    <div style={{ color: '#f43f5e', whiteSpace: 'pre-wrap', marginTop: 4 }}>{terminalOutput.stderr}</div>
                  )}
                  {!terminalOutput.stdout && !terminalOutput.stderr && (
                    <div style={{ color: '#64748b' }}>Process finished with no output.</div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#64748b' }}>Click "Run Code" to execute solution in secure sandbox.</div>
              )}
            </div>

            {/* Terminal Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }} onClick={handleRunCode} disabled={isRunningCode}>
                <Play size={14} />
                <span>{isRunningCode ? 'Running...' : 'Run Code'}</span>
              </button>

              <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }} onClick={handleSingleSubmission} disabled={isSubmitting}>
                <FileCheck size={14} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Solution & Trigger AI'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before Final Submit */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="section-card" style={{ maxWidth: 450, padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>Finish & Submit Assessment?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Are you sure you want to submit your final assessment? All code solutions and evaluations will be recorded for interviewer review.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSubmitAssessment} disabled={isSubmitting}>
                <span>{isSubmitting ? 'Submitting...' : 'Yes, Submit Assessment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
