import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import type { IApiService, LockinData } from "./apiService";
import type { Archive, StashData, SessionTrend } from "../types";

class FirebaseApiService implements IApiService {
  private sanitizeData(data: unknown): unknown {
    if (Array.isArray(data)) {
      return (data as unknown[]).map((v) => this.sanitizeData(v));
    } else if (data !== null && typeof data === "object") {
      const sanitized: Record<string, unknown> = {};
      const obj = data as Record<string, unknown>;
      Object.keys(obj).forEach((key) => {
        if (obj[key] !== undefined) {
          sanitized[key] = this.sanitizeData(obj[key]);
        }
      });
      return sanitized;
    }
    return data;
  }

  // ─── Main workspace data ──────────────────────────────────────────────────

  async loadUserData(userId: string): Promise<LockinData | null> {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as LockinData;
    }
    return null;
  }

  async saveUserData(userId: string, data: LockinData): Promise<void> {
    const docRef = doc(db, "users", userId);
    const sanitized = this.sanitizeData(data) as Record<string, unknown>;
    await setDoc(docRef, sanitized, { merge: true });
  }

  // ─── Archives ─────────────────────────────────────────────────────────────

  async saveArchive(userId: string, archive: Archive): Promise<void> {
    const docRef = doc(db, "users", userId, "archives", archive.id);
    const sanitized = this.sanitizeData(archive) as Record<string, unknown>;
    await setDoc(docRef, sanitized);
  }

  async loadArchives(userId: string): Promise<Archive[]> {
    const col = collection(db, "users", userId, "archives");
    const q = query(col, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Archive);
  }

  async deleteArchive(userId: string, archiveId: string): Promise<void> {
    await deleteDoc(doc(db, "users", userId, "archives", archiveId));
  }

  // ─── Stash (git-stash style, single slot) ─────────────────────────────────

  async saveStash(userId: string, stash: StashData): Promise<void> {
    const docRef = doc(db, "users", userId, "stash", "current");
    const sanitized = this.sanitizeData(stash) as Record<string, unknown>;
    await setDoc(docRef, sanitized);
  }

  async loadStash(userId: string): Promise<StashData | null> {
    const docRef = doc(db, "users", userId, "stash", "current");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as StashData;
    }
    return null;
  }

  async clearStash(userId: string): Promise<void> {
    await deleteDoc(doc(db, "users", userId, "stash", "current"));
  }

  // ─── Session Trends (analytics) ───────────────────────────────────────────

  async saveSessionTrend(userId: string, trend: SessionTrend): Promise<void> {
    const docRef = doc(db, "users", userId, "sessionTrends", trend.sessionId);
    const sanitized = this.sanitizeData(trend) as Record<string, unknown>;
    await setDoc(docRef, sanitized);
  }

  async loadSessionTrends(userId: string): Promise<SessionTrend[]> {
    const col = collection(db, "users", userId, "sessionTrends");
    const q = query(col, orderBy("startTime", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SessionTrend);
  }
}

export const firebaseApiService = new FirebaseApiService();
