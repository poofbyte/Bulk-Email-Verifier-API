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
            <Route path="/docs" element={<DocsRedirect />} />
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

function DocsRedirect() {
  return (
    <div className="py-8 flex-1 flex flex-col items-center">
      <div className="max-w-5xl w-full px-6">
        <span className="text-[10px] font-bold text-accent-600 tracking-widest uppercase font-mono bg-accent-50 px-2 py-0.5 rounded border border-accent-100">
          API DOCUMENTATION
        </span>
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-neutral-900 mt-2">
          Swagger API Reference
        </h1>
        <p className="text-xs text-brand-500 mt-1 mb-4">
          Interactive API documentation with request/response examples.
        </p>
        <div className="bg-white border border-brand-200 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <iframe
            src="/docs"
            className="w-full h-[80vh] border-0"
            title="API Documentation"
          />
        </div>
      </div>
    </div>
  );
}
