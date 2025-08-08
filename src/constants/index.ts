// 应用常量
export const APP_CONFIG = {
  name: "CPU Light",
  version: "0.1.0",
  description: "一个使用Tauri构建的桌面应用程序",
} as const;

export const THEME = {
  colors: {
    primary: "#3B82F6",
    secondary: "#6B7280",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  },
} as const;

export const ROUTES = {
  home: "/",
  settings: "/settings",
  about: "/about",
} as const;
