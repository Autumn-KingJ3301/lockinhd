import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useLockinStore } from "../store/useLockinStore";
import { apiService, type LockinData } from "../services/apiService";

export const useCloudSync = () => {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const setCloudData = useLockinStore((state) => state.setCloudData);
  
  // Use a ref to prevent saving data that was just loaded
  const isInitialLoad = useRef(true);

  // Load user data on login
  useEffect(() => {
    if (initialized && user) {
      const loadData = async () => {
        try {
          const data = await apiService.loadUserData(user.uid);
          if (data) {
            setCloudData(data);
          }
        } catch (error) {
          console.error("Failed to load user data from cloud:", error);
        } finally {
          isInitialLoad.current = false;
        }
      };
      loadData();
    } else if (initialized && !user) {
      isInitialLoad.current = true;
    }
  }, [user, initialized, setCloudData]);

  // Sync state to cloud on changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = useLockinStore.subscribe((state) => {
      if (isInitialLoad.current) return;

      const dataToSave: LockinData = {
        mode: state.mode,
        queue: state.queue,
        session: state.session,
        sessions: state.sessions,
        wrapData: state.wrapData,
        idleSidetracks: state.idleSidetracks,
        showHistoryPanel: state.showHistoryPanel,
        showInboxPanel: state.showInboxPanel,
        theme: state.theme,
        soundEnabled: state.soundEnabled,
      };

      // Debounce saving to prevent excessive API calls
      const timer = setTimeout(() => {
        apiService.saveUserData(user.uid, dataToSave).catch((err) => {
          console.error("Failed to save user data to cloud:", err);
        });
      }, 2000);

      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, [user]);
};
