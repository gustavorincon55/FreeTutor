import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { resetCsrf } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/login/', form);
      resetCsrf();
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-blue-100 p-8 flex flex-col gap-5">
        <h2 className="text-2xl font-bold text-blue-600 m-0">Log In</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            className="border border-blue-100 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-600"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="border border-blue-100 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg py-2.5 transition-colors cursor-pointer border-0"
          >
            Log In
          </button>
        </form>
        <p className="text-sm text-gray-600 m-0">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-semibold">Register</Link>
        </p>
      </div>
    </div>
  );
}
