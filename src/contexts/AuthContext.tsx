import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  resolveIdentifierToEmail,
} from '../firebase';
import { PortalUserProfile } from '../types/assessment';

export const BOOTSTRAP_ADMIN_EMAIL = 'irwanoffice10@gmail.com';

interface PendingProfileMeta {
  displayName?: string;
  username?: string;
}

interface AuthContextValue {
  firebaseUser: User | null;
  userProfile: PortalUserProfile | null;
  authReady: boolean;
  isSigningIn: boolean;
  authError: string | null;
  emailProviderDisabled: boolean;
  clearNotices: () => void;
  signInWithCredentials: (usernameOrEmail: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapFirebaseAuthError(err: unknown): {
  message: string;
  isOperationNotAllowed: boolean;
} {
  const code = (err as { code?: string })?.code || '';
  if (
    code === 'auth/operation-not-allowed' ||
    code === 'auth/configuration-not-found'
  ) {
    return {
      isOperationNotAllowed: true,
      message:
        'Metode login Username/Password belum diaktifkan di Firebase Console untuk proyek ini.',
    };
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return {
      isOperationNotAllowed: false,
      message: 'Username atau kata sandi tidak sesuai.',
    };
  }
  if (code === 'auth/invalid-email') {
    return {
      isOperationNotAllowed: false,
      message:
        'Format username tidak valid. Gunakan huruf, angka, titik, garis bawah, atau tanda hubung.',
    };
  }
  if (code === 'auth/too-many-requests') {
    return {
      isOperationNotAllowed: false,
      message: 'Terlalu banyak percobaan gagal. Silakan tunggu sebentar.',
    };
  }
  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request'
  ) {
    return {
      isOperationNotAllowed: false,
      message: 'Proses masuk dibatalkan. Silakan coba kembali.',
    };
  }
  if (code === 'auth/popup-blocked') {
    return {
      isOperationNotAllowed: false,
      message:
        'Pop-up login diblokir oleh browser. Izinkan pop-up untuk melanjutkan.',
    };
  }
  return {
    isOperationNotAllowed: false,
    message:
      err instanceof Error ? err.message : 'Gagal melakukan autentikasi.',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<PortalUserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [emailProviderDisabled, setEmailProviderDisabled] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const pendingMetaRef = useRef<PendingProfileMeta | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  const clearNotices = useCallback(() => {
    setAuthError(null);
    setEmailProviderDisabled(false);
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!user) {
        setFirebaseUser(null);
        setUserProfile(null);
        setAuthReady(true);
        return;
      }

      setFirebaseUser(user);
      setAuthReady(false);

      const userPath = `users/${user.uid}`;
      const userDocRef = doc(db, 'users', user.uid);
      const isBootstrap =
        Boolean(user.emailVerified) &&
        (user.email || '').toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;

      const pendingMeta = pendingMetaRef.current;
      pendingMetaRef.current = null;

      const safeEmail = (user.email || '').trim().slice(0, 320);
      const derivedUsername =
        pendingMeta?.username ||
        (safeEmail.endsWith('@tka-portal.local')
          ? safeEmail.replace('@tka-portal.local', '')
          : safeEmail.split('@')[0] || 'user'
        )
          .replace(/[^a-zA-Z0-9._-]/g, '')
          .slice(0, 64);

      const safeDisplayName = (
        pendingMeta?.displayName ||
        user.displayName ||
        derivedUsername ||
        'Pengguna Portal'
      )
        .trim()
        .slice(0, 150);

      const safePhoto =
        user.photoURL && user.photoURL.length <= 1024 ? user.photoURL : '';

      try {
        const existingSnap = await getDoc(userDocRef);

        if (!existingSnap.exists()) {
          const initialPayload: Record<string, unknown> = {
            uid: user.uid,
            email: safeEmail,
            displayName: safeDisplayName,
            role: isBootstrap ? 'admin' : 'user',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          };
          if (derivedUsername) {
            initialPayload.username = derivedUsername;
          }
          if (safePhoto) {
            initialPayload.photoURL = safePhoto;
          }

          try {
            await setDoc(userDocRef, initialPayload);
          } catch (createErr) {
            handleFirestoreError(createErr, OperationType.CREATE, userPath);
          }
        } else {
          const currentData = existingSnap.data() as PortalUserProfile;
          if (currentData.status === 'active') {
            const updatePayload: Record<string, unknown> = {
              displayName: currentData.displayName || safeDisplayName,
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            if (safePhoto) {
              updatePayload.photoURL = safePhoto;
            }
            try {
              await updateDoc(userDocRef, updatePayload);
            } catch (updErr) {
              handleFirestoreError(updErr, OperationType.UPDATE, userPath);
            }
          }
        }

        if (isBootstrap) {
          const adminDocRef = doc(db, 'admins', user.uid);
          const adminSnap = await getDoc(adminDocRef);
          if (!adminSnap.exists()) {
            try {
              await setDoc(adminDocRef, {
                uid: user.uid,
                email: safeEmail,
                grantedBy: user.uid,
                createdAt: serverTimestamp(),
              });
            } catch (adminErr) {
              handleFirestoreError(
                adminErr,
                OperationType.CREATE,
                `admins/${user.uid}`
              );
            }
          }
        }
      } catch (err) {
        setFatalError(
          err instanceof Error ? err : new Error(String(err))
        );
        setAuthReady(true);
        return;
      }

      unsubProfile = onSnapshot(
        userDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile(snapshot.data() as PortalUserProfile);
          } else {
            setUserProfile(null);
          }
          setAuthReady(true);
        },
        (snapshotErr) => {
          try {
            handleFirestoreError(snapshotErr, OperationType.GET, userPath);
          } catch (wrappedErr) {
            setFatalError(
              wrappedErr instanceof Error
                ? wrappedErr
                : new Error(String(wrappedErr))
            );
            setAuthReady(true);
          }
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const signInWithCredentials = useCallback(
    async (usernameOrEmail: string, password: string) => {
      setAuthError(null);
      setEmailProviderDisabled(false);

      const trimmedId = usernameOrEmail.trim();
      if (!trimmedId || !password) {
        setAuthError('Username dan kata sandi wajib diisi.');
        return;
      }

      const { email, username } = resolveIdentifierToEmail(trimmedId);
      pendingMetaRef.current = { username };
      setIsSigningIn(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        pendingMetaRef.current = null;
        const mapped = mapFirebaseAuthError(err);
        setAuthError(mapped.message);
        setEmailProviderDisabled(mapped.isOperationNotAllowed);
      } finally {
        setIsSigningIn(false);
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setEmailProviderDisabled(false);
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      setAuthError(mapped.message);
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    pendingMetaRef.current = null;
    setAuthError(null);
    setEmailProviderDisabled(false);
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        authReady,
        isSigningIn,
        authError,
        emailProviderDisabled,
        clearNotices,
        signInWithCredentials,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  }
  return ctx;
}
