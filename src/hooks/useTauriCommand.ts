import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

/**
 * 使用Tauri命令调用的Hook
 */
export const useTauriCommand = <T = unknown>(
  command: string,
  args?: Record<string, unknown>
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (customArgs?: Record<string, unknown>) => {
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
