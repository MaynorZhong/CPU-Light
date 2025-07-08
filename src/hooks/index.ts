import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

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

/**
 * 使用Tauri命令调用的Hook
 */
export const useTauriCommand = <T = any>(
  command: string,
  args?: Record<string, any>
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (customArgs?: Record<string, any>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await invoke<T>(command, customArgs || args);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    execute,
  };
};

/**
 * 使用本地存储的Hook
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};
