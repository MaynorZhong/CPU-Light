import { getCurrentWindow, type Window } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

/**
 * 使用Tauri窗口API的Hook
 */
export const useTauriWindow = () => {
  const [currentWindow, setCurrentWindow] = useState<Window | null>(null);
  // 判断是否是最大化状态
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

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

  const checkWindowState = async () => {
    try {
      const isMaximized = await getCurrentWindow().isMaximized();
      const isMinimized = await getCurrentWindow().isMinimized();
      console.log(
        "Window state - Maximized:",
        isMaximized,
        "Minimized:",
        isMinimized
      );
      // 更新最大化状态
      setIsMinimized(isMinimized);
      setIsMaximized(isMaximized);
    } catch (error) {
      console.error("Error checking window state:", error);
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
    // 手动更新状态
    setTimeout(() => checkWindowState(), 100);
  };

  const maximize = () => {
    currentWindow?.maximize();
    // 手动更新状态
    setTimeout(() => checkWindowState(), 100);
  };

  const hide = () => {
    currentWindow?.hide();
  };

  const unmaximize = () => {
    if (isMaximized) {
      currentWindow?.unmaximize();
    }
    // 手动更新状态
    setTimeout(() => checkWindowState(), 100);
  };

  // 监听窗口变化
  useEffect(() => {
    if (currentWindow) {
      checkWindowState();
      // 监听窗口调整大小事件
      const unlistenPromise = currentWindow.onResized(() => {
        checkWindowState();
      });
      return () => {
        // 确保卸载
        void unlistenPromise.then(unlisten => unlisten());
      };
    }
    // 显式返回 undefined 以满足 noImplicitReturns
    return undefined;
  }, [currentWindow]);

  return {
    currentWindow,
    close,
    destroy,
    minimize,
    maximize,
    hide,
    unmaximize,
    isMaximized,
    isMinimized,
  };
};
