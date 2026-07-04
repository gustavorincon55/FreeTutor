import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { formatTimezone } from '../components/TimezoneSelect';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


const EMPTY_FORM = { role: 'tutor', topic: '', time_windows: [] };
const EMPTY_WINDOW = { day: 'Monday', start: '09:00', end: '10:00' };

const inputCls = 'border border-blue-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 bg-white';
const btnPrimary = 'bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors cursor-pointer border-0';
const btnGhost = 'border border-blue-100 text-gray-600 hover:border-blue-600 hover:text-blue-600 rounded-lg px-3 py-1.5 text-sm bg-transparent cursor-pointer transition-colors';
const btnDanger = 'bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-3 py-1.5 text-sm cursor-pointer border-0 transition-colors';

export default function Availability() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [windowDraft, setWindowDraft] = useState(EMPTY_WINDOW);
  const [formError, setFormError] = useState('');
  const [matchingSessions, setMatchingSessions] = useState([]);

  const defaultRole = () => {
    if (profile?.is_tutor && !profile?.is_learner) return 'tutor';
    if (profile?.is_learner && !profile?.is_tutor) return 'learner';
    return 'tutor';
  };

  const fetchEntries = async () => {
    const res = await api.get('/api/availability/');
    setEntries(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM, role: defaultRole() });
    setWindowDraft(EMPTY_WINDOW);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (entry) => {
    setEditingId(entry.id);
    setFormData({ role: entry.role, topic: entry.topic, time_windows: [...entry.time_windows] });
    setWindowDraft(EMPTY_WINDOW);
    setFormError('');
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); };

  const addWindow = () => {
    if (windowDraft.start >= windowDraft.end) {
      setFormError('Start time must be before end time.');
      return;
    }
    const duplicate = formData.time_windows.some(
      (w) => w.day === windowDraft.day && w.start === windowDraft.start && w.end === windowDraft.end
    );
    if (duplicate) {
      setFormError('This time window already exists.');
      return;
    }
    setFormData({ ...formData, time_windows: [...formData.time_windows, { ...windowDraft }] });
    setWindowDraft(EMPTY_WINDOW);
    setFormError('');
  };

  const removeWindow = (index) =>
    setFormData({ ...formData, time_windows: formData.time_windows.filter((_, i) => i !== index) });

  const handleSave = async () => {
    if (!formData.topic.trim()) { setFormError('Topic is required.'); return; }
    if (formData.time_windows.length === 0) { setFormError('Add at least one time window.'); return; }
    setFormError('');
    try {
      if (editingId) {
        await api.put(`/api/availability/${editingId}/`, formData);
      } else {
        await api.post('/api/availability/', formData);
      }
      setShowForm(false);
      fetchEntries();
      // If tutor, check for open requests matching this new availability
      if (formData.role === 'tutor') {
        const res = await api.get(`/api/sessions/open/?topic=${encodeURIComponent(formData.topic)}`);
        setMatchingSessions(res.data);
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this availability entry?')) return;
    await api.delete(`/api/availability/${id}/`);
    fetchEntries();
  };

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="max-w-2xl">
      {/* Banner shown after saving tutor availability when open requests match */}
      {matchingSessions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <span className="text-blue-500 text-lg">🎯</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800 m-0 mb-1">
              {matchingSessions.length} open student request{matchingSessions.length > 1 ? 's' : ''} match your availability!
            </p>
            <p className="text-xs text-blue-600 m-0 mb-2">Head to Sessions to accept them.</p>
            <button
              onClick={() => navigate('/sessions')}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 py-1 border-0 cursor-pointer transition-colors"
            >
              View matching requests →
            </button>
          </div>
          <button onClick={() => setMatchingSessions([])} className="text-blue-300 hover:text-blue-600 bg-transparent border-0 cursor-pointer text-lg leading-none">×</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 m-0">Availability</h2>
        {!showForm && (
          <button className={btnPrimary} onClick={openCreate}>+ Add Entry</button>
        )}
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 mt-0">{editingId ? 'Edit Entry' : 'New Entry'}</h3>
          {formError && <p className="text-red-600 text-sm mb-3">{formError}</p>}

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Role</label>
              {profile?.is_tutor && profile?.is_learner ? (
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={inputCls}
                >
                  <option value="tutor">Tutor</option>
                  <option value="learner">Learner</option>
                </select>
              ) : (
                <p className={`text-sm font-semibold rounded-full px-2.5 py-0.5 inline-block ${formData.role === 'tutor' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {formData.role === 'tutor' ? 'Tutor' : 'Learner'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Topic</label>
              {(() => {
                const roleTopics = formData.role === 'tutor'
                  ? (profile?.tutor_subjects || [])
                  : (profile?.learner_subjects || []);
                if (roleTopics.length === 0) {
                  return <p className="text-sm text-gray-400 italic">No subjects found for this role. Add subjects in your Profile first.</p>;
                }
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {roleTopics.map((t) => (
                      <button
                        key={t}
                        onClick={() => setFormData({ ...formData, topic: t })}
                        className={`text-sm rounded-full px-3 py-1 border-2 cursor-pointer font-medium transition-colors ${
                          formData.topic === t
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-blue-100 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 bg-transparent'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-semibold text-gray-800">Time Windows</label>
                {profile?.timezone && (
                  <span
                    title="You can update your timezone on your Profile page"
                    className="text-xs text-gray-400 cursor-default select-none"
                  >
                    🕐 {formatTimezone(profile.timezone)}
                  </span>
                )}
              </div>
              {formData.time_windows.length > 0 && (
                <ul className="list-none p-0 m-0 mb-3 flex flex-col gap-1.5">
                  {formData.time_windows.map((w, i) => (
                    <li key={i} className="flex items-center justify-between text-sm text-gray-700 bg-white border border-blue-100 rounded-lg px-3 py-1.5">
                      <span>{w.day} · {w.start}–{w.end}</span>
                      <button onClick={() => removeWindow(i)} className="text-gray-400 hover:text-red-600 bg-transparent border-0 cursor-pointer text-lg leading-none">×</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <select value={windowDraft.day} onChange={(e) => setWindowDraft({ ...windowDraft, day: e.target.value })} className={inputCls}>
                  {DAYS.map((d) => <option key={d}>{d}</option>)}
                </select>
                <input type="time" value={windowDraft.start} onChange={(e) => setWindowDraft({ ...windowDraft, start: e.target.value })} className={inputCls} />
                <span className="text-gray-500 text-sm">to</span>
                <input type="time" value={windowDraft.end} onChange={(e) => setWindowDraft({ ...windowDraft, end: e.target.value })} className={inputCls} />
                <button onClick={addWindow} className={btnGhost}>Add Window</button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button className={btnGhost} onClick={cancelForm}>Cancel</button>
            <button className={btnPrimary} onClick={handleSave}>Save</button>
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <p className="text-gray-400 text-sm">No availability set yet. Add an entry to get matched with other users.</p>
      )}

      <div className="flex flex-col gap-3">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${entry.role === 'tutor' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {entry.role}
              </span>
              <span className="font-semibold text-gray-900 flex-1 capitalize">{entry.topic}</span>
              <div className="flex gap-2">
                <button className={btnGhost} onClick={() => openEdit(entry)}>Edit</button>
                <button className={btnDanger} onClick={() => handleDelete(entry.id)}>Delete</button>
              </div>
            </div>
            <ul className="list-none p-0 m-0 flex flex-col gap-1">
              {entry.time_windows.map((w, i) => (
                <li key={i} className="text-sm text-gray-600">{w.day} · {w.start}–{w.end}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
