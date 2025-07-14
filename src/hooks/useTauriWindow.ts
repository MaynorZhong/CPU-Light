import { getCurrentWindow, type Window } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

/**
 * 使用Tauri窗口API的Hook
 */
export const useTauriWindow = () => {
  const [currentWindow, setCurrentWindow] = useState<Window | null>(null);

  const getWindow = async () => {
    try {
      const tauriWindow = await getCurrentWindow();
      if (!tauriWindow) {
        throw new Error("Failed to get current window");
      }
      setCurrentWindow(tauriWindow);
    } catch (error) {
      console.error("Error getting current window:", error);
    }
  };

  useEffect(() => {
    getWindow();
  }, []);

  const close = () => {
    currentWindow?.close();
  };

  const destroy = () => {
    currentWindow?.destroy();
  };

  const minimize = () => {
    currentWindow?.minimize();
  };

  const maximize = () => {
    currentWindow?.maximize();
  };

  const hide = () => {
    currentWindow?.hide();
  };

  return {
    currentWindow,
    close,
    destroy,
    minimize,
    maximize,
    hide,
  };
};
