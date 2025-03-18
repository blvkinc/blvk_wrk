import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Workspace } from './components/Workspace';
import { Login } from './components/Login';
import { AuthCallback } from './components/AuthCallback';
import { LogOut, Loader, Upload, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';

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
  const { user, loading, signOut, syncWorkspace, isSyncing, isWorkspaceSynced, lastSyncedAt } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSyncWorkspace = async () => {
    if (isSyncing) return;
    await syncWorkspace();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed bottom-4 right-4 flex flex-col items-end gap-3 z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncWorkspace}
            disabled={isSyncing}
            className={`p-2 minimal-button rounded-lg hover:bg-white/10 flex items-center gap-2 ${
              isSyncing ? 'opacity-70' : ''
            }`}
            title={
              lastSyncedAt
                ? `Last synced: ${format(new Date(lastSyncedAt), 'MMM d, h:mm a')}`
                : 'Sync workspace to cloud'
            }
          >
            {isSyncing ? (
              <>
                <Loader className="w-4 h-4 text-white animate-spin" />
                <span className="text-white text-xs">Syncing...</span>
              </>
            ) : isWorkspaceSynced ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-white text-xs">Synced</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-white" />
                <span className="text-white text-xs">Sync</span>
              </>
            )}
          </button>
          
          {lastSyncedAt && !isMobile && (
            <div className="text-white/50 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(lastSyncedAt), 'MMM d, h:mm a')}
            </div>
          )}
        </div>

        <button
          onClick={signOut}
          className="p-2 minimal-button rounded-lg hover:bg-white/10"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 text-white" />
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