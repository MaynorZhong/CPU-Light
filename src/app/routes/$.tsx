import { data } from "react-router";

export async function clientLoader() {
  return data({}, 404);
}
export default function CatchAll() {
  // 对于特定的开发者工具请求，返回空响应
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path.includes(".well-known") || path.includes("favicon.ico")) {
      return null;
    }
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>页面未找到</h2>
      <p>您访问的页面不存在</p>
      <a href="/" style={{ color: "#007bff", textDecoration: "none" }}>
        返回首页
      </a>
    </div>
  );
}
