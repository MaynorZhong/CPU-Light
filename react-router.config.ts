import type { Config } from "@react-router/dev/config";

export default {
  // 禁用 SSR，使用客户端渲染模式
  ssr: false,
  appDirectory: "src/app",
  // 添加基本的构建配置
  buildDirectory: "dist",
} satisfies Config;
