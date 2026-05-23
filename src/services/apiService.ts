import type { Session, QueueItem, AppMode, Theme } from "../types";
import { firebaseApiService } from "./firebaseService";

export interface LockinData {
  mode: AppMode;
  queue: QueueItem[];
  session: Session | null;
  sessions: Session[];
  wrapData: Session | null;
  idleSidetracks: string[];
  showHistoryPanel: boolean;
  showInboxPanel: boolean;
  showTasksPanel: boolean;
  showPanicModal: boolean;
  theme: Theme;
  soundEnabled: boolean;
  zenMode: boolean;
  triageSidetracks: string[];
  activeTriageIndex: number;
}

export interface IApiService {
  loadUserData(userId: string): Promise<LockinData | null>;
  saveUserData(userId: string, data: LockinData): Promise<void>;
}

export const apiService: IApiService = firebaseApiService;
