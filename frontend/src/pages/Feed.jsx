import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { generateHourSlots } from '../utils/slots';

function ConnectModal({ post, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState([]);

  const slots = post.overlap_windows || [];

  const toggleSlot = (slot) => {
    const key = `${slot.day}|${slot.start}|${slot.end}`;
    setSelected((prev) => {
      const exists = prev.find((s) => `${s.day}|${s.start}|${s.end}` === key);
      return exists ? prev.filter((s) => `${s.day}|${s.start}|${s.end}` !== key) : [...prev, slot];
    });
  };

  const isSelected = (slot) =>
    selected.some((s) => s.day === slot.day && s.start === slot.start && s.end === slot.end);

  const handleConnect = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/posts/${post.id}/connect/`, { slots: selected });
      setCount(res.data.count);
      setDone(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to connect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-lg m-0">
            {done ? 'Request sent!' : `Connect with ${post.user.username}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-transparent border-0 cursor-pointer text-2xl leading-none">×</button>
        </div>

        {done ? (
          <>
            <p className="text-sm text-gray-600 m-0">
              {count} session{count !== 1 ? 's' : ''} sent to <strong>{post.user.username}</strong> for <strong>{post.topic}</strong>. They need to confirm — check Sessions to track status.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="border border-gray-200 text-gray-600 rounded-lg px-4 py-2 text-sm bg-transparent cursor-pointer hover:border-gray-400 transition-colors">Close</button>
              <button onClick={() => navigate('/sessions')} className="bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 text-sm cursor-pointer border-0 transition-colors">View Sessions</button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm text-gray-600 mb-3">Pick the slots you want for <strong>{post.topic}</strong>:</p>
              <div className="flex flex-col gap-1.5">
                {slots.map((w, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleSlot(w)}
                    className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border-2 cursor-pointer transition-colors text-left ${
                      isSelected(w)
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-blue-100 bg-white text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    <span className="font-semibold">{w.day}</span>
                    <span className="text-gray-400">·</span>
                    {w.start} – {w.end}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 m-0">The tutor will need to confirm. You'll see it as "Pending tutor confirmation" in Sessions.</p>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="border border-gray-200 text-gray-600 rounded-lg px-4 py-2 text-sm bg-transparent cursor-pointer hover:border-gray-400 transition-colors">Cancel</button>
              <button onClick={handleConnect} disabled={loading || selected.length === 0} className="bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg px-5 py-2 text-sm cursor-pointer border-0 transition-colors disabled:opacity-50">
                {loading ? 'Connecting…' : `Request ${selected.length || ''} slot${selected.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getStatusLabel(status, isMine) {
  switch (status) {
    case 'open':
      return { text: 'Open', cls: 'bg-blue-50 text-blue-600 border-blue-100' };
    case 'pending_learner':
      return isMine
        ? { text: 'Pending your reply', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
        : { text: 'Pending learner reply', cls: 'bg-yellow-50 text-yellow-600 border-yellow-200' };
    case 'pending_tutor':
      return isMine
        ? { text: 'Pending tutor reply', cls: 'bg-orange-50 text-orange-600 border-orange-200' }
        : { text: 'Pending your reply', cls: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'confirmed':
      return { text: 'Confirmed', cls: 'bg-green-50 text-green-700 border-green-200' };
    default:
      return { text: status, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  }
}

function Avatar({ username }) {
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-blue-600">{username?.[0]?.toUpperCase()}</span>
    </div>
  );
}

function SlotRow({ slot, isMine, onAccept, accepting }) {
  const label = getStatusLabel(slot.status, isMine);
  return (
    <div className="flex items-center justify-between text-sm border border-blue-100 rounded-lg px-3 py-1.5 bg-white gap-3">
      <span className="font-medium text-gray-700">{slot.day} · {slot.start_time}–{slot.end_time}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border ${label.cls}`}>{label.text}</span>
        {!isMine && slot.can_accept && (
          <button
            onClick={() => onAccept(slot.id)}
            disabled={accepting === slot.id}
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 py-0.5 border-0 cursor-pointer transition-colors disabled:opacity-50"
          >
            {accepting === slot.id ? '…' : 'Accept'}
          </button>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onDelete, onSlotAccepted, onConnect }) {
  const isOffer = post.type === 'offer';
  const [accepting, setAccepting] = useState(null);
  const slots = post.sessions || [];

  const handleAccept = async (sessionId) => {
    setAccepting(sessionId);
    try {
      await api.post(`/api/sessions/${sessionId}/action/`, { action: 'accept' });
      onSlotAccepted();
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div className="bg-white border border-blue-100 rounded-xl p-4 flex gap-3">
      <Avatar username={post.user.username} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="font-semibold text-gray-900 text-sm">{post.user.username}</span>
          <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${
            isOffer ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isOffer ? 'Offering' : 'Requesting'}
          </span>
          <span className="text-xs bg-blue-50 border border-blue-100 text-blue-700 rounded-full px-2.5 py-0.5 font-medium">
            {post.topic}
          </span>
          <span className="text-xs text-gray-400 ml-auto">{timeAgo(post.created_at)}</span>
        </div>

        {post.notes && <p className="text-sm text-gray-600 mb-2">{post.notes}</p>}

        {/* Sessions: show active slots with status + accept buttons (both offer and request) */}
        {slots.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {slots.map((s) => (
              <SlotRow
                key={s.id}
                slot={s}
                isMine={post.is_mine}
                onAccept={handleAccept}
                accepting={accepting}
              />
            ))}
          </div>
        )}

        {/* Offer with no active sessions yet: show predefined time slots + connect button */}
        {isOffer && slots.length === 0 && post.time_slots?.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {post.time_slots.map((s, i) => (
              <div key={i} className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                {s.day} · {s.start}–{s.end}
              </div>
            ))}
          </div>
        )}

        {/* Offer: connect button when viewer has matching availability */}
        {isOffer && post.can_connect && !post.is_mine && (
          <button
            onClick={() => onConnect(post)}
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 py-1 border-0 cursor-pointer transition-colors mt-2"
          >
            Connect →
          </button>
        )}
      </div>

      {post.is_mine && (
        <button
          onClick={() => onDelete(post.id)}
          className="text-gray-300 hover:text-red-500 bg-transparent border-0 cursor-pointer text-xl leading-none shrink-0 self-start"
          title="Delete post"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function Feed() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [connectPost, setConnectPost] = useState(null);
  const [postType, setPostType] = useState('offer');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [userAvailability, setUserAvailability] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async (type = 'all') => {
    const params = type !== 'all' ? `?type=${type}` : '';
    const res = await api.get(`/api/posts/${params}`);
    setPosts(res.data);
    setLoading(false);
  };

  const fetchAvailability = async () => {
    const res = await api.get('/api/availability/');
    setUserAvailability(res.data);
  };

  const fetchUserSessions = async () => {
    try {
      const res = await api.get('/api/sessions/');
      setUserSessions(res.data);
    } catch {
      setUserSessions([]);
    }
  };

  useEffect(() => { fetchPosts(filter); }, [filter]);
  useEffect(() => { fetchAvailability(); fetchUserSessions(); }, []);

  const topicsForType = postType === 'offer'
    ? (profile?.tutor_subjects || [])
    : (profile?.learner_subjects || []);

  // Slots blocked by confirmed sessions or existing active posts for the current topic+type
  const takenSlotKeys = (() => {
    if (!selectedTopic) return new Set();
    const topic = selectedTopic.toLowerCase();
    const keys = new Set();

    // Confirmed sessions (as tutor or learner) block the slot entirely
    userSessions
      .filter((s) => s.topic.toLowerCase() === topic && s.status === 'confirmed')
      .forEach((s) => keys.add(`${s.day}|${s.start_time}|${s.end_time}`));

    // Active own posts of the same type claim their slots
    posts
      .filter((p) => p.is_mine && p.type === postType && p.topic.toLowerCase() === topic)
      .flatMap((p) => p.time_slots || [])
      .forEach((s) => keys.add(`${s.day}|${s.start}|${s.end}`));

    return keys;
  })();

  // Generate 1-hour slots from the user's availability, minus already-taken ones
  const availableSlots = (() => {
    if (!selectedTopic) return [];
    const role = postType === 'offer' ? 'tutor' : 'learner';
    const relevant = userAvailability.filter(
      (a) => a.role === role && a.topic.toLowerCase() === selectedTopic.toLowerCase()
    );
    return relevant
      .flatMap((a) => generateHourSlots(a.time_windows))
      .filter((slot) => !takenSlotKeys.has(`${slot.day}|${slot.start}|${slot.end}`));
  })();

  const toggleSlot = (slot) => {
    const key = `${slot.day}|${slot.start}|${slot.end}`;
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => `${s.day}|${s.start}|${s.end}` === key);
      return exists ? prev.filter((s) => `${s.day}|${s.start}|${s.end}` !== key) : [...prev, slot];
    });
  };

  const isSlotSelected = (slot) =>
    selectedSlots.some((s) => s.day === slot.day && s.start === slot.start && s.end === slot.end);

  const openForm = () => {
    const defaultType = profile?.is_tutor && !profile?.is_learner ? 'offer'
      : !profile?.is_tutor && profile?.is_learner ? 'request'
      : 'offer';
    setPostType(defaultType);
    setSelectedTopic('');
    setSelectedSlots([]);
    setNotes('');
    setFormError('');
    setShowForm(true);
  };

  const handleTypeChange = (t) => { setPostType(t); setSelectedTopic(''); setSelectedSlots([]); };
  const handleTopicChange = (t) => { setSelectedTopic(t); setSelectedSlots([]); };

  const handleSubmit = async () => {
    if (!selectedTopic) { setFormError('Please select a topic.'); return; }
    if (selectedSlots.length === 0) {
      setFormError('Please select at least one time slot.'); return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const payload = { type: postType, topic: selectedTopic, notes, time_slots: selectedSlots };
      const res = await api.post('/api/posts/', payload);
      setPosts((prev) => [res.data, ...prev]);
      fetchUserSessions();
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to post.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/api/posts/${id}/`);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const filterBtnCls = (val) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border transition-colors ${
      filter === val
        ? 'bg-blue-600 text-white border-blue-600'
        : 'border-blue-100 text-gray-600 bg-white hover:border-blue-400'
    }`;

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 m-0">Feed</h2>
        <button onClick={openForm}
          className="bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors cursor-pointer border-0">
          + New Post
        </button>
      </div>

      {/* New Post modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg m-0">New Post</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700 bg-transparent border-0 cursor-pointer text-2xl leading-none">×</button>
            </div>

            {formError && <p className="text-red-600 text-sm m-0">{formError}</p>}

            {/* Type toggle */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">I am…</p>
              <div className="flex gap-2 flex-wrap">
                {profile?.is_tutor && (
                  <button type="button" onClick={() => handleTypeChange('offer')}
                    className={`rounded-full border-2 px-3 py-1 font-semibold text-sm cursor-pointer transition-colors ${
                      postType === 'offer' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 text-gray-600 bg-white hover:border-green-400'
                    }`}>
                    Offering help
                  </button>
                )}
                {profile?.is_learner && (
                  <button type="button" onClick={() => handleTypeChange('request')}
                    className={`rounded-full border-2 px-3 py-1 font-semibold text-sm cursor-pointer transition-colors ${
                      postType === 'request' ? 'border-yellow-500 bg-yellow-500 text-white' : 'border-gray-200 text-gray-600 bg-white hover:border-yellow-400'
                    }`}>
                    Requesting help
                  </button>
                )}
              </div>
            </div>

            {/* Topic */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Topic</p>
              {topicsForType.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No subjects for this role. Add them in Profile first.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topicsForType.map((t) => (
                    <button key={t} type="button" onClick={() => handleTopicChange(t)}
                      className={`text-sm rounded-full px-3 py-1 border-2 cursor-pointer font-medium transition-colors ${
                        selectedTopic === t ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-100 text-gray-600 bg-white hover:border-blue-400'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time slot picker — shown for both offer and request posts */}
            {selectedTopic && (
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  Time slots <span className="text-gray-400 font-normal text-xs">(1h each, from your availability)</span>
                </p>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No {postType === 'offer' ? 'tutor' : 'learner'} availability found for {selectedTopic}. Add it in Availability first.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSlots.map((slot, i) => {
                        const selected = isSlotSelected(slot);
                        return (
                          <button key={i} type="button" onClick={() => toggleSlot(slot)}
                            className={`text-xs rounded-full px-2.5 py-1 border-2 cursor-pointer font-medium transition-colors ${
                              selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-100 text-gray-600 bg-white hover:border-blue-400'
                            }`}>
                            {slot.day} {slot.start}–{slot.end}
                          </button>
                        );
                      })}
                    </div>
                    {selectedSlots.length > 0 && (
                      <p className="text-xs text-blue-500 mt-1.5">{selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Any extra context — your level, what you're looking for…"
                rows={2}
                className="w-full border border-blue-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 resize-none" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 hover:border-gray-400 rounded-lg px-4 py-2 text-sm bg-transparent cursor-pointer transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg px-5 py-2 text-sm cursor-pointer border-0 transition-colors disabled:opacity-50">
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect modal for offer posts */}
      {connectPost && (
        <ConnectModal
          post={connectPost}
          onClose={() => { setConnectPost(null); fetchPosts(filter); }}
        />
      )}

      {/* Filter bar */}
      <div className="flex gap-2 mb-5">
        <button className={filterBtnCls('all')} onClick={() => setFilter('all')}>All</button>
        <button className={filterBtnCls('offer')} onClick={() => setFilter('offer')}>Offers</button>
        <button className={filterBtnCls('request')} onClick={() => setFilter('request')}>Requests</button>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-400 text-sm">
          {filter === 'all' ? 'No posts yet. Be the first to post!' : `No ${filter}s yet.`}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDelete}
              onSlotAccepted={() => fetchPosts(filter)}
              onConnect={setConnectPost}
            />
          ))}
        </div>
      )}
    </div>
  );
}
