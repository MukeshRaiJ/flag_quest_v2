import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/firebase";
import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "@/firebase/Auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const signInAnon = async () => {
    try {
      setLoading(true);
      const result = await signInAnonymously(auth);
      await initializeUserProfile(result.user.uid);
      return result.user;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await initializeUserProfile(result.user.uid);
      return result.user;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      setError((error as Error).message);
      throw error;
    }
  };

  const initializeUserProfile = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: auth.currentUser?.displayName || "Anonymous Player",
        highScore: 0,
        gamesPlayed: 0,
        achievements: [],
        lastPlayed: serverTimestamp(),
      });
    }
  };

  return { user, loading, error, signInAnon, signInWithGoogle, signOut };
};
