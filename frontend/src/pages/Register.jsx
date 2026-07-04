import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { inferTimezone } from '../components/TimezoneSelect';

const PREDEFINED_TOPICS = [
  'Mathematics', 'English', 'Excel', 'Python', 'JavaScript',
  'Java', 'Physics', 'Chemistry', 'Biology', 'History',
  'Spanish', 'French', 'Statistics', 'Calculus', 'Economics',
  'Writing', 'Accounting', 'Data Science', 'SQL', 'C++',
];

const inputCls = 'border border-blue-100 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-600 w-full';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [isTutor, setIsTutor] = useState(false);
  const [isLearner, setIsLearner] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleTopic = (t) =>
    setSelectedTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isTutor && !isLearner) {
      setError('Please select at least one role (Tutor or Learner).');
      return;
    }
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/register/', form);

      const fd = new FormData();
      fd.append('is_tutor', String(isTutor));
      fd.append('is_learner', String(isLearner));
      fd.append('tutor_subjects', JSON.stringify(isTutor ? selectedTopics : []));
      fd.append('learner_subjects', JSON.stringify(isLearner ? selectedTopics : []));
      fd.append('timezone', inferTimezone());
      await api.patch('/api/profile/', fd);

      navigate('/profile');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-blue-100 p-8 flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-blue-600 m-0">Create Account</h2>

        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 m-0">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Account info */}
          <div className="flex flex-col gap-3">
            <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required className={inputCls} />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className={inputCls} />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className={inputCls} />
          </div>

          {/* Role selection */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">I want to be a <span className="text-red-400">*</span></p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsTutor((v) => !v)}
                className={`flex-1 rounded-xl border-2 py-3 font-semibold text-sm transition-colors cursor-pointer ${
                  isTutor
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-blue-100 text-gray-600 bg-white hover:border-blue-300'
                }`}
              >
                🎓 Tutor
              </button>
              <button
                type="button"
                onClick={() => setIsLearner((v) => !v)}
                className={`flex-1 rounded-xl border-2 py-3 font-semibold text-sm transition-colors cursor-pointer ${
                  isLearner
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-blue-100 text-gray-600 bg-white hover:border-blue-300'
                }`}
              >
                📚 Learner
              </button>
            </div>
            {isTutor && isLearner && (
              <p className="text-xs text-blue-500 mt-1.5">Both selected — topics will be added to tutor and learner subjects.</p>
            )}
          </div>

          {/* Topic selection */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Topics <span className="text-red-400">*</span></p>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTopic(t)}
                  className={`text-sm rounded-full px-3 py-1 border-2 cursor-pointer font-medium transition-colors ${
                    selectedTopics.includes(t)
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-blue-100 text-gray-600 bg-white hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {selectedTopics.length > 0 && (
              <p className="text-xs text-blue-500 mt-1.5">{selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''} selected</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg py-2.5 transition-colors cursor-pointer border-0 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="text-sm text-gray-600 m-0">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
}
