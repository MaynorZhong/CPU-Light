import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

import svgr from "vite-plugin-svgr";

import { reactRouter } from "@react-router/dev/vite";

import tsconfigPaths from "vite-tsconfig-paths";

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), svgr()],

  // 路径别名配置
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@stores": path.resolve(__dirname, "./src/stores"),
      "@api": path.resolve(__dirname, "./src/api"),
    },
  },

  // 构建优化
  build: {
    // 生成 sourcemap 便于调试
    sourcemap: process.env.NODE_ENV === "development",
    // 优化构建大小
    minify: "esbuild" as const,
    // 输出目录
    outDir: "dist",
    // 清空输出目录
    emptyOutDir: true,
    // 静态资源处理
    assetsDir: "assets",
    // 代码分割配置
    rollupOptions: {
      output: {
        manualChunks: {
          // 将React相关库分离到单独的chunk
          react: ["react", "react-dom"],
          // 将Tauri API分离到单独的chunk
          tauri: ["@tauri-apps/api"],
        },
      },
    },
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 设置构建目标
    target: "esnext",
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
  },

  // 优化依赖预构建
  optimizeDeps: {
    // 包含需要预构建的依赖
    include: [
      "react",
      "react-dom",
      "@tauri-apps/api/core",
      "@tauri-apps/api/event",
      "@tauri-apps/api/window",
      "@tauri-apps/api/app",
      "@tauri-apps/api/path",
      "@tauri-apps/api/fs",
      "@tauri-apps/api/notification",
      "@tauri-apps/api/dialog",
      "@tauri-apps/api/shell",
      "@tauri-apps/api/clipboard",
      "@tauri-apps/api/globalShortcut",
      "@tauri-apps/api/http",
      "@tauri-apps/api/process",
      "@tauri-apps/api/updater",
    ],
    // 排除不需要预构建的依赖
    exclude: ["@tauri-apps/cli"],
  },

  // CSS配置
  css: {
    devSourcemap: true,
  },

  // 开发服务器配置
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    // 启用CORS
    cors: true,
    // 开启HMR
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    // 文件监听配置
    watch: {
      // 忽略src-tauri目录的变化
      ignored: ["**/src-tauri/**", "**/target/**", "**/.git/**"],
      // 启用深度监听
      usePolling: false,
      // 设置监听间隔
      interval: 100,
    },
    // 代理配置（如果需要）
    proxy: {
      // 示例：代理API请求
      // '/api': {
      //   target: 'http://localhost:3000',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // }
    },
  },

  // 预览服务器配置
  preview: {
    port: 4173,
    strictPort: true,
    host: host || false,
  },

  // 环境变量配置
  define: {
    // 在构建时替换环境变量
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    __PROD__: JSON.stringify(process.env.NODE_ENV === "production"),
  },

  // ESBuild配置
  esbuild: {
    // 在生产环境中移除console和debugger
    drop:
      process.env.NODE_ENV === "production"
        ? ["console" as const, "debugger" as const]
        : [],
    // 设置目标
    target: "esnext",
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
}));
