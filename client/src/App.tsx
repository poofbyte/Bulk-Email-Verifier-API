import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Security from '@/pages/Security';
import Gdpr from '@/pages/Gdpr';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-brand-50 flex flex-col text-brand-900 font-sans">
        <Header />
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/security" element={<Security />} />
            <Route path="/gdpr" element={<Gdpr />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}
