/// <reference types="vite-plugin-svgr/client" />
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

// SVG 模块声明：支持默认导出路径字符串 & 命名导出 ReactComponent
declare module "*.svg" {
  import * as React from "react";
  export const ReactComponent: React.FC<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  const src: string;
  export default src;
}

export {};
