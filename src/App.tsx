import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Workspace } from './components/Workspace';
import { Login } from './components/Login';
import { AuthCallback } from './components/AuthCallback';
import { LogOut } from 'lucide-react';

const EmailConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-white text-center">
        <h2 className="text-xl mb-4">Email Confirmed!</h2>
        <p>You can now sign in to your account.</p>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="relative min-h-screen bg-black">
      <div className={`fixed ${isMobile ? 'bottom-4 right-4' : 'top-4 right-4'} flex items-center gap-2 z-50`}>
        <button
          onClick={signOut}
          className="p-2 minimal-button rounded-lg hover:bg-red-500/20 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 text-red-400" />
        </button>
      </div>
      <Workspace />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <DndProvider backend={HTML5Backend}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/email-confirmation" element={<EmailConfirmation />} />
            <Route path="*" element={<AppContent />} />
          </Routes>
        </AuthProvider>
      </DndProvider>
    </Router>
  );
};

export default App;