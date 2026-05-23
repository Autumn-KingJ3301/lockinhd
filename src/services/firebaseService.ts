import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import type { IApiService, LockinData } from "./apiService";

class FirebaseApiService implements IApiService {
  private sanitizeData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(v => this.sanitizeData(v));
    } else if (data !== null && typeof data === 'object') {
      const sanitized: any = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          sanitized[key] = this.sanitizeData(data[key]);
        }
      });
      return sanitized;
    }
    return data;
  }

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
    const sanitized = this.sanitizeData(data);
    await setDoc(docRef, sanitized, { merge: true });
  }
}

export const firebaseApiService = new FirebaseApiService();
