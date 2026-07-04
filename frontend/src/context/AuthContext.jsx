import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/profile/');
      setProfile(res.data);
    } catch {
      setProfile(false);
      navigate('/login');
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  return (
    <AuthContext.Provider value={{ profile, setProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
