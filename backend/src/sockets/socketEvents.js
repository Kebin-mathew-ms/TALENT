module.exports = {
  // Assessment Room Events
  ASSESSMENT_JOIN: 'assessment:join',
  ASSESSMENT_LEAVE: 'assessment:leave',
  ASSESSMENT_STARTED: 'assessment:started',
  ASSESSMENT_ENDED: 'assessment:ended',
  ASSESSMENT_STATE: 'assessment:state',

  // Candidate Status Events
  CANDIDATE_JOINED: 'candidate:joined',
  CANDIDATE_LEFT: 'candidate:left',
  CANDIDATE_RECONNECTED: 'candidate:reconnected',
  CANDIDATE_STATUS_CHANGED: 'candidate:status-changed',
  CANDIDATE_COMPLETED: 'candidate:completed',
  CANDIDATE_TYPING: 'candidate:typing',

  // Candidate Session Events (Isolated to session_<sessionId>)
  SESSION_JOIN: 'session:join',
  SESSION_LEAVE: 'session:leave',
  SESSION_STATE: 'session:state',
  QUESTION_CHANGED: 'session:question-changed',
  CODE_CHANGED: 'session:code-changed',
  CODE_SNAPSHOT: 'session:code-snapshot',

  // Connection Status
  CONNECTION_STATUS: 'connection:status',

  // WebRTC Signaling Events
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc:ice-candidate',
  WEBRTC_PEER_READY: 'webrtc:peer-ready',
  WEBRTC_PEER_LEFT: 'webrtc:peer-left',
};
