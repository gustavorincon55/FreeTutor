import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Availability from './pages/Availability';
import Sessions from './pages/Sessions';
import Feed from './pages/Feed';
import Calendar from './pages/Calendar';
import ChangePassword from './pages/ChangePassword';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
