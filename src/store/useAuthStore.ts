import { create } from "zustand";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, googleProvider } from "../utils/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthActions {
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setInitialized: (val) => set({ initialized: val }),

  loginWithGoogle: async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  },
}));

// Initialize listener
onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, loading: false, initialized: true });
});
