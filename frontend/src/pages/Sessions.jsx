import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function SessionCard({ session, currentUserId, onAction }) {
  const { status, tutor, learner, topic, day, start_time, end_time } = session;
  const isLearner = learner.id === currentUserId;
  const isTutor = tutor?.id === currentUserId;
  const [loading, setLoading] = useState(null);

  const act = async (action) => {
    setLoading(action);
    try { await onAction(session.id, action); }
    finally { setLoading(null); }
  };

  const statusLabel = (() => {
    if (status === 'open') return { text: 'Open', cls: 'bg-blue-50 text-blue-600 border-blue-100' };
    if (status === 'pending_tutor')
      return isTutor
        ? { text: 'Pending your reply', cls: 'bg-orange-50 text-orange-700 border-orange-200' }
        : { text: 'Pending tutor reply', cls: 'bg-orange-50 text-orange-600 border-orange-200' };
    if (status === 'pending_learner')
      return isLearner
        ? { text: 'Pending your reply', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
        : { text: 'Pending learner reply', cls: 'bg-yellow-50 text-yellow-600 border-yellow-200' };
    if (status === 'confirmed') return { text: 'Confirmed', cls: 'bg-green-50 text-green-700 border-green-200' };
    return { text: status, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  })();
  const statusBadge = (
    <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${statusLabel.cls}`}>
      {statusLabel.text}
    </span>
  );

  return (
    <div className="bg-white border border-blue-100 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-gray-900 text-sm capitalize">{topic}</span>
        {statusBadge}
        <span className="text-xs text-gray-400 ml-auto">{day} · {start_time}–{end_time}</span>
      </div>

      <div className="flex gap-4 text-xs text-gray-500">
        <span>
          <span className="font-medium text-gray-700">Tutor: </span>
          {tutor ? tutor.username : <span className="text-blue-500 italic">Waiting for tutor</span>}
        </span>
        <span>
          <span className="font-medium text-gray-700">Learner: </span>{learner.username}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap pt-1">
        {/* Tutor confirms a session a learner connected to (offer flow) */}
        {isTutor && status === 'pending_tutor' && (
          <>
            <button onClick={() => act('confirm')} disabled={!!loading}
              className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-full px-3 py-1 border-0 cursor-pointer transition-colors disabled:opacity-50">
              {loading === 'confirm' ? '…' : 'Confirm'}
            </button>
            <button onClick={() => act('cancel')} disabled={!!loading}
              className="text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 rounded-full px-3 py-1 bg-transparent cursor-pointer transition-colors disabled:opacity-50">
              {loading === 'cancel' ? '…' : 'Decline'}
            </button>
          </>
        )}

        {/* Tutor accepts an open request (shown in "matching" section) */}
        {!isLearner && !isTutor && status === 'open' && (
          <button onClick={() => act('accept')} disabled={!!loading}
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 py-1 border-0 cursor-pointer transition-colors disabled:opacity-50">
            {loading === 'accept' ? '…' : 'Accept'}
          </button>
        )}

        {/* Learner confirms or rejects after tutor accepts */}
        {isLearner && status === 'pending_learner' && (
          <>
            <button onClick={() => act('confirm')} disabled={!!loading}
              className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-full px-3 py-1 border-0 cursor-pointer transition-colors disabled:opacity-50">
              {loading === 'confirm' ? '…' : 'Confirm'}
            </button>
            <button onClick={() => act('reject')} disabled={!!loading}
              className="text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 rounded-full px-3 py-1 bg-transparent cursor-pointer transition-colors disabled:opacity-50">
              {loading === 'reject' ? '…' : 'Decline'}
            </button>
          </>
        )}

        {/* Either party can cancel a confirmed session */}
        {(isLearner || isTutor) && status === 'confirmed' && (
          <button onClick={() => act('cancel')} disabled={!!loading}
            className="text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 rounded-full px-3 py-1 bg-transparent cursor-pointer transition-colors disabled:opacity-50">
            {loading === 'cancel' ? '…' : 'Cancel'}
          </button>
        )}

        {/* Learner cancels their own open, pending_tutor, or pending_learner request */}
        {isLearner && (status === 'open' || status === 'pending_tutor' || status === 'pending_learner') && (
          <button onClick={() => act('cancel')} disabled={!!loading}
            className="text-xs text-gray-400 hover:text-red-500 border-0 bg-transparent cursor-pointer transition-colors disabled:opacity-50">
            {loading === 'cancel' ? '…' : 'Cancel request'}
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, subtitle, sessions, currentUserId, onAction }) {
  if (sessions.length === 0) return null;
  return (
    <div className="mb-7">
      <h3 className="text-base font-semibold text-gray-700 mb-0.5">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mb-3">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      <div className="flex flex-col gap-2">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} currentUserId={currentUserId} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

export default function Sessions() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const myRes = await api.get('/api/sessions/');
      setSessions(myRes.data);
    } catch {
      setSessions([]);
    }
    try {
      const openRes = await api.get('/api/sessions/open/');
      setOpenRequests(openRes.data);
    } catch {
      setOpenRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAction = async (id, action) => {
    await api.post(`/api/sessions/${id}/action/`, { action });
    await fetchAll();
  };

  if (loading) return <p className="text-gray-500">Loading…</p>;

  const userId = profile?.id;

  // Tutor must confirm (learner connected to their offer)
  const pendingTutorConfirm = sessions.filter((s) => s.status === 'pending_tutor' && s.tutor?.id === userId);
  // Learner waiting for tutor to confirm (informational)
  const awaitingTutorConfirm = sessions.filter((s) => s.status === 'pending_tutor' && s.learner.id === userId);
  // Learner must confirm (tutor accepted their request)
  const pendingMyConfirm = sessions.filter((s) => s.status === 'pending_learner' && s.learner.id === userId);
  const myOpen = sessions.filter((s) => s.status === 'open' && s.learner.id === userId);
  const confirmed = sessions.filter((s) => s.status === 'confirmed');
  const acceptableRequests = openRequests.filter((s) => !sessions.some((ms) => ms.id === s.id));

  const hasAnything = [pendingTutorConfirm, awaitingTutorConfirm, pendingMyConfirm, myOpen, confirmed, acceptableRequests].some((g) => g.length > 0);

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Sessions</h2>

      {!hasAnything && (
        <p className="text-gray-400 text-sm">No sessions yet. Post or respond to a request in the Feed.</p>
      )}

      <Section
        title="Confirm student request"
        subtitle="A student connected to your offer — confirm to lock it in."
        sessions={pendingTutorConfirm}
        currentUserId={userId}
        onAction={handleAction}
      />

      <Section
        title="Awaiting tutor confirmation"
        subtitle="The tutor has been notified and will confirm shortly."
        sessions={awaitingTutorConfirm}
        currentUserId={userId}
        onAction={handleAction}
      />

      <Section
        title="Waiting for your confirmation"
        sessions={pendingMyConfirm}
        currentUserId={userId}
        onAction={handleAction}
      />

      <Section
        title="Your open requests"
        subtitle="Waiting for a tutor to accept"
        sessions={myOpen}
        currentUserId={userId}
        onAction={handleAction}
      />

      <Section
        title="Requests matching your availability"
        subtitle="Accept any of these — the learner will then confirm."
        sessions={acceptableRequests}
        currentUserId={userId}
        onAction={handleAction}
      />

      <Section
        title="Confirmed"
        sessions={confirmed}
        currentUserId={userId}
        onAction={handleAction}
      />
    </div>
  );
}
