import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface AuthProps {
  isAdminLogin?: boolean;
  onSuccess?: () => void;
}

export function Auth({ isAdminLogin, onSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [showCreateAccountSuggestion, setShowCreateAccountSuggestion] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdminLogin) {
      const savedEmail = localStorage.getItem('adminEmail');
      const savedPassword = localStorage.getItem('adminPassword');
      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(atob(savedPassword));
        setRememberMe(true);
      } else {
        setEmail('tellitlikeitisjoe@gmail.com');
        setPassword('LastPassword1$');
      }
    }
  }, [isAdminLogin]);

  const createProfile = async (userId: string, userEmail: string) => {
    try {
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Only create profile if it doesn't exist
      if (!existingProfile) {
        const isAdmin = userEmail.endsWith('@admin.com') || 
                       userEmail === 'tellitlikeitisjoe@gmail.com' || 
                       userEmail === 'thejoeycagle@gmail.com';
                       
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              email: userEmail,
              attempts: 1,
              role_type: isAdmin ? 'admin' : 'applicant'
            }
          ]);

        if (profileError) throw profileError;
      }
    } catch (err) {
      console.error('Error managing profile:', err);
      throw err;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      } 
      
      if (data.user) {
        try {
          await createProfile(data.user.id, email);
          
          // After successful signup, automatically sign in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            setError('Account created but failed to sign in. Please try signing in manually.');
            setLoading(false);
            return;
          }
          
          // Call onSuccess callback before navigation if provided
          if (onSuccess) {
            onSuccess();
          }
          
          // Add a short delay before navigation to ensure profile is properly created
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
            setLoading(false);
          }, 500);
        } catch (err) {
          console.error("Profile creation error:", err);
          setError("An error occurred during account setup. Please try signing in manually.");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred during signup.");
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setShowCreateAccountSuggestion(false);
    setLoading(true);

    try {
      // Check if this is an admin login attempt and validate email
      if (isAdminLogin && !email.endsWith('@admin.com') && 
          email !== 'thejoeycagle@gmail.com' && 
          email !== 'tellitlikeitisjoe@gmail.com') {
        setError('Invalid admin credentials. Please use an admin email address.');
        setLoading(false);
        return;
      }

      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Check if this might be a new user
        const { data: userExists } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (!userExists && !isAdminLogin) {
          setError('Email not found. Did you mean to create a new account?');
          setShowCreateAccountSuggestion(true);
        } else {
          setError('Incorrect email or password. Please try again or reset your password.');
        }
        setLoading(false);
        return;
      } 
      
      if (data.user) {
        try {
          // Create or update profile
          await createProfile(data.user.id, email);
          
          // Handle admin login remember me
          if (isAdminLogin && rememberMe) {
            localStorage.setItem('adminEmail', email);
            localStorage.setItem('adminPassword', btoa(password));
          } else {
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('adminPassword');
          }

          // Check if user is admin
          const isAdmin = email === 'tellitlikeitisjoe@gmail.com' || 
                          email === 'thejoeycagle@gmail.com' || 
                          email.endsWith('@admin.com');
          
          // Update role_type to ensure it's correct
          if (isAdmin) {
            await supabase
              .from('profiles')
              .update({ role_type: 'admin' })
              .eq('id', data.user.id);
          }
          
          // Call onSuccess callback before navigation if provided
          if (onSuccess) {
            onSuccess();
          }
          
          // Route based on login context and admin status with a short delay
          setTimeout(() => {
            if (isAdminLogin) {
              if (isAdmin) {
                navigate('/admin', { replace: true });
              } else {
                setError('You do not have admin access.');
              }
            } else {
              // Regular user login
              if (isAdmin) {
                // Admin logging in through regular login still goes to admin
                navigate('/admin', { replace: true });
              } else {
                // Regular user goes to dashboard
                navigate('/dashboard', { replace: true });
              }
            }
            setLoading(false);
          }, 500);
        } catch (profileError) {
          console.error('Profile error:', profileError);
          setError('Error accessing user profile. Please try again.');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An unexpected error occurred during sign in.");
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Password reset instructions have been sent to your email.');
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An unexpected error occurred while requesting password reset.");
    } finally {
      setLoading(false);
    }
  };

  if (isResetMode) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <button
          onClick={() => setIsResetMode(false)}
          className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to sign in
        </button>

        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Reset Password
        </h2>

        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700"
              placeholder="you@example.com"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          {message && (
            <div className="text-sm text-green-500">{message}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
        Sign in to continue
      </h2>

      <form className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {isAdminLogin ? 'Admin Email' : 'Email'}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isAdminLogin && (
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Remember me
            </label>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}

        {message && (
          <div className="text-sm text-green-500">{message}</div>
        )}

        <div className="flex flex-col space-y-4">
          {!isAdminLogin && (
            <>
              {showCreateAccountSuggestion ? (
                <button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create New Account'}
                </button>
              ) : (
                <button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              )}
            </>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium ${
              isAdminLogin 
                ? 'bg-purple-600 hover:bg-purple-700 text-white border border-transparent' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Signing In...' : isAdminLogin ? 'Access Admin Portal' : 'Sign In'}
          </button>

          {!isAdminLogin && (
            <button
              type="button"
              onClick={() => setIsResetMode(true)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot your password?
            </button>
          )}
        </div>
      </form>
    </div>
  );
}