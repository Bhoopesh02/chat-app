import React, { useState } from 'react';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { chatService } from '../services/chatService';

const validatePassword = (password) => {
  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
};

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isForgotPassword) {
      if (!email) {
        setError('Please enter your email address.');
        return;
      }
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage('Password reset link sent! Check your email.');
      } catch (err) {
        console.error(err);
        if (err.code === 'auth/user-not-found') {
          setError('No account found with this email.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Invalid email address.');
        } else if (err.code === 'auth/too-many-requests') {
          setError('Too many requests. Please wait a few minutes before trying again.');
        } else {
          setError('Failed to send reset link. Please try again.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    const trimmedName = name.trim();

    if (isRegistering) {
      if (!trimmedName) {
        setError('Username is required for registration.');
        return;
      }

      if (trimmedName.length < 5 || trimmedName.length > 8) {
        setError('Username must be between 5 and 8 characters long.');
        return;
      }

      const passError = validatePassword(password);
      if (passError) {
        setError(passError);
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegistering) {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Check if username already exists in Realtime Database
        const usernameExists = await chatService.checkUsernameExists(trimmedName, userCredential.user.uid);
        if (usernameExists) {
          await userCredential.user.delete();
          setError('The username is already exist enter different one');
          setLoading(false);
          return;
        }

        // 3. Update profile display name & RTDB user profile
        await updateProfile(userCredential.user, { displayName: trimmedName });
        await chatService.createUserProfile(userCredential.user.uid, trimmedName, email);
        
        setSuccessMessage('Registration successful!');
      } else {
        // Login existing user
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Access to this account has been temporarily disabled. Please try again later or reset your password.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/account-exists-with-different-credential') {
        try {
          const email = err.customData?.email;
          if (email) {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            if (methods && methods.includes('password')) {
              setError(`An account already exists with ${email} — please sign in with your password instead.`);
            } else {
              setError(`An account already exists with ${email} using a different sign-in method.`);
            }
          } else {
             setError('An account already exists with this email.');
          }
        } catch (fetchErr) {
           setError('An account already exists with this email. Please sign in with your password.');
        }
      } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="login-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="login-card">
        <div className="login-logo">
          <MessageSquare size={48} />
        </div>
        <h1 className="login-title">Chat App</h1>
        <p className="login-subtitle">
          {isForgotPassword ? 'Reset your password' : isRegistering ? 'Create a new account' : 'Sign in to continue'}
        </p>

        {error && (
          <div className="auth-alert error-alert">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="auth-alert success-alert">
            {successMessage}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {!isForgotPassword && isRegistering && (
            <div className="form-group">
              <label htmlFor="name">Username</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter username (5-8 characters)"
                minLength={5}
                maxLength={8}
                required={isRegistering}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {!isForgotPassword && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {!isRegistering && (
                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="forgot-password-btn"
                    onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : isRegistering ? 'Register' : 'Login')}
          </button>
        </form>

        {!isForgotPassword && (
          <>
            <div className="login-divider">
              <span>or</span>
            </div>
            
            <button 
              type="button" 
              className="btn-google" 
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </>
        )}

        <div className="login-footer">
          {isForgotPassword ? (
            <p>
              Remembered your password?{' '}
              <button
                type="button"
                className="login-switch-btn"
                onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMessage(''); }}
              >
                Back to Login
              </button>
            </p>
          ) : isRegistering ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="login-switch-btn"
                onClick={() => { setIsRegistering(false); setError(''); setSuccessMessage(''); }}
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="login-switch-btn"
                onClick={() => { setIsRegistering(true); setError(''); setSuccessMessage(''); }}
              >
                Register
              </button>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
