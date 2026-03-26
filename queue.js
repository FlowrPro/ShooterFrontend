// ===========================
// Moborr.io Queue System
// ===========================

let queueState = {
  isQueued: false,
  joinedAt: null,
  matchId: null
};

export function joinQueue() {
  if (queueState.isQueued) return;
  
  queueState.isQueued = true;
  queueState.joinedAt = Date.now();
  queueState.matchId = generateMatchId();
  
  console.log('🎮 Joined queue:', queueState.matchId);
}

export function leaveQueue() {
  queueState.isQueued = false;
  queueState.joinedAt = null;
  queueState.matchId = null;
  
  console.log('❌ Left queue');
}

export function isInQueue() {
  return queueState.isQueued;
}

export function getQueueTime() {
  if (!queueState.joinedAt) return 0;
  return Math.floor((Date.now() - queueState.joinedAt) / 1000);
}

export function getMatchId() {
  return queueState.matchId;
}

export function formatQueueTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateMatchId() {
  return 'MATCH_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export function getQueueStatus() {
  return {
    isQueued: queueState.isQueued,
    timeInQueue: getQueueTime(),
    formattedTime: formatQueueTime(getQueueTime()),
    matchId: queueState.matchId
  };
}
