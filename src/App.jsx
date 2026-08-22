import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { chatService } from './services/chatService';
import Login from './pages/Login';
import Chat from './pages/Chat';

const AnimatedRoutes = ({ user }) => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={user ? <Navigate to="/chat" replace /> : <Login />}
        />
        <Route
          path="/chat"
          element={user ? <Chat currentUser={user} /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to={user ? "/chat" : "/login"} replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // if (!firebaseUser.emailVerified) {
        //   setUser(null);
        //   setLoading(false);
        //   return;
        // }

        let name = firebaseUser.displayName || firebaseUser.email.split('@')[0];

        // Ensure the user exists in Realtime Database (fixes missing profiles from Firestore phase)
        try {
          const profile = await chatService.ensureUserProfile(firebaseUser.uid, name, firebaseUser.email, firebaseUser.photoURL);
          if (profile && profile.name) {
            name = profile.name;
          }
          chatService.setPresence(firebaseUser.uid);
        } catch (err) {
          console.error("Could not ensure profile or set presence:", err);
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: name
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <AnimatedRoutes user={user} />
    </Router>
  );
}

export default App;
