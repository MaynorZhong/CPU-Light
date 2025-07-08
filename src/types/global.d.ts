// 全局类型定义
declare global {
  // 在构建时会被替换的全局变量
  const __DEV__: boolean;
  const __PROD__: boolean;
}

// Tauri相关类型扩展
declare module "@tauri-apps/api/core" {
  // 可以在这里扩展Tauri API的类型
}

// 环境变量类型
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_API_URL: string;
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
