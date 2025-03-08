import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (isSignUp) {
        await signUp(email, password);
        setSuccess('Check your email for the confirmation link!');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await resetPassword(email);
      setSuccess('Password reset link sent to your email!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="minimal-border rounded-lg p-6 sm:p-8 w-full max-w-sm bg-black/80 backdrop-blur-sm">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="minimal-input w-full text-white text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="minimal-input w-full text-white text-sm sm:text-base"
              required={!isSignUp}
            />
          </div>
          {error && (
            <div className="text-red-400 text-xs sm:text-sm">{error}</div>
          )}
          {success && (
            <div className="text-green-400 text-xs sm:text-sm">{success}</div>
          )}
          <button
            type="submit"
            className="minimal-button w-full py-2 text-white text-sm sm:text-base"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-white text-xs sm:text-sm hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
            {!isSignUp && (
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-white text-xs sm:text-sm hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}; 