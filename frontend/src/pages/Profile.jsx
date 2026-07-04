import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { resetCsrf } from '../api';
import TimezoneSelect, { formatTimezone } from '../components/TimezoneSelect';

const PREDEFINED_TOPICS = [
  'Mathematics', 'English', 'Excel', 'Python', 'JavaScript',
  'Java', 'Physics', 'Chemistry', 'Biology', 'History',
  'Spanish', 'French', 'Statistics', 'Calculus', 'Economics',
  'Writing', 'Accounting', 'Data Science', 'SQL', 'C++',
];

const EMPTY_FORM = (profile) => ({
  bio: profile.bio || '',
  is_tutor: profile.is_tutor,
  is_learner: profile.is_learner,
  tutor_subjects: [...(profile.tutor_subjects || [])],
  learner_subjects: [...(profile.learner_subjects || [])],
  timezone: profile.timezone || 'UTC',
});

function SubjectTag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-0.5 text-sm font-medium">
      {label}
      {onRemove && (
        <button onClick={onRemove} className="text-blue-400 hover:text-blue-700 bg-transparent border-0 cursor-pointer p-0 leading-none text-base">×</button>
      )}
    </span>
  );
}

function SubjectEditor({ subjects, role, formData, setFormData, inputVal, setInputVal }) {
  const key = `${role}_subjects`;

  const add = (val) => {
    const v = val.trim();
    if (!v || formData[key].includes(v)) return;
    setFormData({ ...formData, [key]: [...formData[key], v] });
    setInputVal('');
  };

  const remove = (s) =>
    setFormData({ ...formData, [key]: formData[key].filter((x) => x !== s) });

  const available = PREDEFINED_TOPICS.filter((t) => !formData[key].includes(t));

  return (
    <div className="flex flex-col gap-3">
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => <SubjectTag key={s} label={s} onRemove={() => remove(s)} />)}
        </div>
      )}
      {available.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Quick add:</p>
          <div className="flex flex-wrap gap-1.5">
            {available.map((t) => (
              <button key={t} onClick={() => add(t)}
                className="text-xs border border-blue-100 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full px-2.5 py-0.5 bg-transparent cursor-pointer transition-colors">
                + {t}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <input
          placeholder="Or type a custom subject…"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add(inputVal)}
          className="border border-blue-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-600 flex-1"
        />
        <button onClick={() => add(inputVal)}
          className="border border-blue-100 text-gray-600 hover:border-blue-600 hover:text-blue-600 rounded-lg px-3 py-1.5 text-sm bg-transparent cursor-pointer transition-colors">
          Add
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [tutorInput, setTutorInput] = useState('');
  const [learnerInput, setLearnerInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!profile) return <p className="text-gray-500">Loading…</p>;

  const openEdit = () => {
    setFormData(EMPTY_FORM(profile));
    setPhotoFile(null);
    setError('');
    setEditMode(true);
  };

  const cancelEdit = () => { setEditMode(false); setFormData(null); };

  const handleLogout = async () => {
    await api.post('/api/logout/');
    resetCsrf();
    navigate('/login');
  };

  const handleSave = async () => {
    if (!formData.is_tutor && !formData.is_learner) {
      setError('You must be at least a Tutor or a Learner.');
      return;
    }
    if (formData.is_tutor && formData.tutor_subjects.length === 0) {
      setError('Please add at least one subject for your tutor role.');
      return;
    }
    if (formData.is_learner && formData.learner_subjects.length === 0) {
      setError('Please add at least one subject for your learner role.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('bio', formData.bio);
      fd.append('is_tutor', String(formData.is_tutor));
      fd.append('is_learner', String(formData.is_learner));
      fd.append('tutor_subjects', JSON.stringify(formData.tutor_subjects));
      fd.append('learner_subjects', JSON.stringify(formData.learner_subjects));
      fd.append('timezone', formData.timezone);
      if (photoFile) fd.append('photo', photoFile);
      const res = await api.patch('/api/profile/', fd);
      setProfile(res.data);
      setEditMode(false);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to save profile.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!editMode) {
    return (
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 m-0">Profile</h2>
          <button onClick={openEdit}
            className="bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors cursor-pointer border-0">
            Edit Profile
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex items-start gap-5 mb-6">
          {profile.photo
            ? <img src={profile.photo} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shrink-0" />
            : <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center shrink-0">
                <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </div>
          }
          <div>
            <h3 className="text-xl font-bold text-gray-900 m-0 mb-0.5">{profile.username}</h3>
            {profile.email && <p className="text-sm text-gray-500 m-0 mb-1">{profile.email}</p>}
            {profile.timezone && (
              <p className="text-xs text-gray-400 m-0 mb-2">🕐 {formatTimezone(profile.timezone)}</p>
            )}
            <div className="flex gap-2">
              {profile.is_tutor && (
                <span className="text-xs font-semibold bg-green-100 text-green-700 rounded-full px-2.5 py-0.5">Tutor</span>
              )}
              {profile.is_learner && (
                <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full px-2.5 py-0.5">Learner</span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-5 pb-5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Bio</p>
          {profile.bio
            ? <p className="text-gray-700 m-0">{profile.bio}</p>
            : <p className="text-gray-400 text-sm m-0 italic">No bio added yet.</p>
          }
        </div>

        {/* Tutor subjects */}
        <div className="mb-5 pb-5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Tutor Subjects</p>
          {profile.is_tutor && profile.tutor_subjects.length > 0
            ? <div className="flex flex-wrap gap-2">{profile.tutor_subjects.map((s) => <SubjectTag key={s} label={s} />)}</div>
            : <p className="text-gray-400 text-sm m-0 italic">
                {profile.is_tutor ? 'No subjects added yet.' : 'Not set as a tutor.'}
              </p>
          }
        </div>

        {/* Learner subjects */}
        <div className="mb-6 pb-5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Learner Subjects</p>
          {profile.is_learner && profile.learner_subjects.length > 0
            ? <div className="flex flex-wrap gap-2">{profile.learner_subjects.map((s) => <SubjectTag key={s} label={s} />)}</div>
            : <p className="text-gray-400 text-sm m-0 italic">
                {profile.is_learner ? 'No subjects added yet.' : 'Not set as a learner.'}
              </p>
          }
        </div>

        {/* Log Out */}
        <button onClick={handleLogout}
          className="border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 rounded-lg px-4 py-2 text-sm bg-transparent cursor-pointer transition-colors">
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 m-0">Edit Profile</h2>
        <div className="flex gap-2">
          <button onClick={cancelEdit} disabled={saving}
            className="border border-blue-100 text-gray-600 hover:border-blue-600 hover:text-blue-600 rounded-lg px-4 py-2 text-sm bg-transparent cursor-pointer transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors cursor-pointer border-0 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Photo</label>
          <div className="flex items-center gap-4">
            <div className="relative group">
              {photoFile
                ? <img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-blue-300" />
                : profile.photo
                  ? <img src={profile.photo} alt="Current" className="w-16 h-16 rounded-full object-cover border-2 border-blue-200" />
                  : <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    </div>
              }
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => document.getElementById('photo-input').click()}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => document.getElementById('photo-input').click()}
                className="border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-1.5 text-sm font-medium bg-transparent cursor-pointer transition-colors"
              >
                {photoFile ? 'Change photo' : profile.photo ? 'Change photo' : 'Upload photo'}
              </button>
              {photoFile && (
                <button
                  type="button"
                  onClick={() => setPhotoFile(null)}
                  className="text-xs text-gray-400 hover:text-red-500 bg-transparent border-0 cursor-pointer p-0 text-left transition-colors"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-gray-400 m-0">JPG, PNG — max 5MB</p>
            </div>
          </div>
          <input
            id="photo-input"
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files[0])}
            className="hidden"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            className="w-full border border-blue-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Timezone</label>
          <TimezoneSelect
            value={formData.timezone}
            onChange={(tz) => setFormData({ ...formData, timezone: tz })}
            className="border border-blue-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 w-full bg-white"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
            <input type="checkbox" checked={formData.is_tutor}
              onChange={(e) => setFormData({ ...formData, is_tutor: e.target.checked })}
              className="accent-blue-600" />
            I am a tutor
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
            <input type="checkbox" checked={formData.is_learner}
              onChange={(e) => setFormData({ ...formData, is_learner: e.target.checked })}
              className="accent-blue-600" />
            I am a learner
          </label>
        </div>

        {formData.is_tutor && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Tutor Subjects</label>
            <SubjectEditor subjects={formData.tutor_subjects} role="tutor"
              formData={formData} setFormData={setFormData}
              inputVal={tutorInput} setInputVal={setTutorInput} />
          </div>
        )}

        {formData.is_learner && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Learner Subjects</label>
            <SubjectEditor subjects={formData.learner_subjects} role="learner"
              formData={formData} setFormData={setFormData}
              inputVal={learnerInput} setInputVal={setLearnerInput} />
          </div>
        )}
      </div>
    </div>
  );
}
