import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export function resolveIdentifierToEmail(identifier: string): {
  email: string;
  username: string;
} {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes('@')) {
    const rawUser = trimmed.split('@')[0] || 'user';
    const cleanUser = rawUser.replace(/[^a-z0-9._-]/g, '') || 'user';
    return {
      email: trimmed.slice(0, 320),
      username: cleanUser.slice(0, 64),
    };
  }
  const cleanUsername = trimmed
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._-]/g, '');
  const safeUsername = (cleanUsername || 'user').slice(0, 64);
  return {
    email: `${safeUsername}@tka-portal.local`.slice(0, 320),
    username: safeUsername,
  };
}

export async function createAuthAccountAsAdmin(
  usernameInput: string,
  password: string,
  displayName: string
): Promise<{ uid: string; email: string; username: string }> {
  const { email, username } = resolveIdentifierToEmail(usernameInput);
  if (username.length < 3) {
    throw new Error('Username minimal terdiri dari 3 karakter huruf atau angka.');
  }
  const secondaryApp = initializeApp(
    firebaseConfig,
    `admin-creator-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  );
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password
    );
    const trimmedName = displayName.trim().slice(0, 150);
    if (trimmedName) {
      await updateProfile(cred.user, { displayName: trimmedName });
    }
    await signOut(secondaryAuth);
    return {
      uid: cred.user.uid,
      email,
      username,
    };
  } finally {
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
