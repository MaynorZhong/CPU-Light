// 状态管理（建议使用Zustand或Valtio）
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  theme: "light" | "dark";
  language: "zh" | "en";
  isFullscreen: boolean;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (lang: "zh" | "en") => void;
  toggleFullscreen: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      theme: "light",
      language: "zh",
      isFullscreen: false,
      setTheme: theme => set({ theme }),
      setLanguage: language => set({ language }),
      toggleFullscreen: () =>
        set(state => ({ isFullscreen: !state.isFullscreen })),
    }),
    {
      name: "app-storage",
    }
  )
);
