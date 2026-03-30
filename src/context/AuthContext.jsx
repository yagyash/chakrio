import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext(null);

/**
 * Normalise Firestore profile into a consistent properties array.
 * Supports both old schema (top-level sheet_id) and new schema (properties array).
 */
function normaliseProperties(profile) {
  if (Array.isArray(profile.properties) && profile.properties.length > 0) {
    return profile.properties;
  }
  // Backward compat: old single-property structure (sheet_id OR supabase_property_id at top level)
  if (profile.sheet_id || profile.supabase_property_id) {
    return [{
      id: 'default',
      property_name: profile.property_name ?? 'My Property',
      sheet_id: profile.sheet_id ?? '',
      ...(profile.supabase_property_id && { supabase_property_id: profile.supabase_property_id }),
    }];
  }
  return [];
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [profileStatus, setProfileStatus] = useState('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setUserProfile(null);
        setProperties([]);
        setSelectedProperty(null);
        setProfileStatus('unauthenticated');
        return;
      }

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profile = docSnap.data();
          const props = normaliseProperties(profile);

          setUserProfile(profile);
          setProperties(props);

          // Auto-select if only one property — skip the picker
          if (props.length === 1) {
            setSelectedProperty(props[0]);
          } else {
            setSelectedProperty(null);
          }

          setProfileStatus('ready');
        } else {
          setUserProfile(null);
          setProperties([]);
          setSelectedProperty(null);
          setProfileStatus('pending');
        }
      } catch {
        setUserProfile(null);
        setProperties([]);
        setSelectedProperty(null);
        setProfileStatus('error');
      }
    });

    return unsubscribe;
  }, []);

  // Idle logout — sign out after 10 minutes of no activity
  useEffect(() => {
    if (!firebaseUser) return;

    const IDLE_MS = 10 * 60 * 1000;
    let timer;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => signOut(auth), IDLE_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [firebaseUser]);

  const logout = () => {
    setSelectedProperty(null);
    return signOut(auth);
  };

  const selectProperty = (prop) => setSelectedProperty(prop);

  const loading = profileStatus === 'loading';

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        properties,
        selectedProperty,
        selectProperty,
        profileStatus,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
