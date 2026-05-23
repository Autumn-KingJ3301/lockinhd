import type { Session, QueueItem, AppMode, Theme, Archive, StashData, SessionTrend } from "../types";
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
  activeArchiveId?: string | null;
  activeArchiveLabel?: string | null;
}

export interface IApiService {
  // Main workspace
  loadUserData(userId: string): Promise<LockinData | null>;
  saveUserData(userId: string, data: LockinData): Promise<void>;

  // Archives
  saveArchive(userId: string, archive: Archive): Promise<void>;
  loadArchives(userId: string): Promise<Archive[]>;
  deleteArchive(userId: string, archiveId: string): Promise<void>;

  // Stash
  saveStash(userId: string, stash: StashData): Promise<void>;
  loadStash(userId: string): Promise<StashData | null>;
  clearStash(userId: string): Promise<void>;

  // Session trends (analytics)
  saveSessionTrend(userId: string, trend: SessionTrend): Promise<void>;
  loadSessionTrends(userId: string): Promise<SessionTrend[]>;
}

export const apiService: IApiService = firebaseApiService;
