import { useState } from 'react';
import api from '../api';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');
    setError('');

    try {
      const response = await api.post('/api/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setMessage(response.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to change password.'
      );
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Change Password
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-6"
      >
        <label className="block mb-2 font-medium">
          Current password
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 mb-4"
          required
        />

        <label className="block mb-2 font-medium">
          New password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 mb-4"
          required
        />

        <label className="block mb-2 font-medium">
          Confirm new password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 mb-4"
          required
        />

        {message && (
          <p className="text-green-600 text-sm mb-4">
            {message}
          </p>
        )}

        {error && (
          <p className="text-red-600 text-sm mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Change Password
        </button>
      </form>
    </div>
  );
}