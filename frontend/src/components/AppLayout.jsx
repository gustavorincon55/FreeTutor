import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import api, { resetCsrf } from '../api';

const navClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg font-medium transition-colors no-underline text-sm ${
    isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-100 hover:text-blue-700'
  }`;

function SidebarContent() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.post('/api/logout/');
    resetCsrf();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-blue-50 border-r border-blue-100 flex flex-col px-4 py-6 fixed top-0 left-0 bottom-0 z-50">
        <span className="text-xl font-bold text-blue-600 mb-8 block">FreeTutor</span>

        <nav className="flex flex-col gap-1 flex-1">
          <NavLink to="/feed" className={navClass}>Feed</NavLink>
          <NavLink to="/profile" className={navClass}>Profile</NavLink>
          <NavLink to="/availability" className={navClass}>Availability</NavLink>
          <NavLink to="/sessions" className={navClass}>Sessions</NavLink>
          <NavLink to="/calendar" className={navClass}>Calendar</NavLink> 
        </nav>

        <div className="border-t border-blue-100 pt-4">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 bg-transparent border-0 cursor-pointer p-0 text-left group"
          >
            {profile?.photo
              ? <img src={profile.photo} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-blue-200 shrink-0" />
              : <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                </div>
            }
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors m-0 truncate">
                {profile?.username ?? '…'}
              </p>
              {profile?.is_tutor && profile?.is_learner && (
                <p className="text-xs text-gray-400 m-0">Tutor & Learner</p>
              )}
              {profile?.is_tutor && !profile?.is_learner && (
                <p className="text-xs text-gray-400 m-0">Tutor</p>
              )}
              {profile?.is_learner && !profile?.is_tutor && (
                <p className="text-xs text-gray-400 m-0">Learner</p>
              )}
            </div>
          </button>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-8 text-left">
        <Outlet />
      </main>
    </div>
  );
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <SidebarContent />
    </AuthProvider>
  );
}
