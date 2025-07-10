import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState, useEffect } from "react";

/**
 * 使用Tauri窗口API的Hook
 */
export const useTauriWindow = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const window = getCurrentWindow();

  useEffect(() => {
    const setupWindowListeners = async () => {
      // 监听窗口状态变化
      await window.onResized(() => {
        checkWindowState();
      });

      // 初始检查窗口状态
      checkWindowState();
    };

    const checkWindowState = async () => {
      try {
        setIsMaximized(await window.isMaximized());
        setIsFullscreen(await window.isFullscreen());
        setIsMinimized(await window.isMinimized());
      } catch (error) {
        console.error("Error checking window state:", error);
      }
    };

    setupWindowListeners();
  }, [window]);

  const minimize = () => window.minimize();
  const maximize = () => window.maximize();
  const unmaximize = () => window.unmaximize();
  const toggleMaximize = () => (isMaximized ? unmaximize() : maximize());
  const close = () => window.close();
  const hide = () => window.hide();
  const show = () => window.show();

  return {
    window,
    isMaximized,
    isFullscreen,
    isMinimized,
    minimize,
    maximize,
    unmaximize,
    toggleMaximize,
    close,
    hide,
    show,
  };
};
