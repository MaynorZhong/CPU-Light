import { useState } from "react";

function Home() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#333", marginBottom: "20px" }}>
        CPU Light - Tauri App
      </h1>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="请输入您的名字..."
          style={{
            width: "300px",
            padding: "10px",
            marginRight: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />

        <button
          onClick={() => setGreetMsg(`Hello ${name}!`)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          问候
        </button>
      </div>

      {greetMsg && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "4px",
            color: "#155724",
          }}
        >
          {greetMsg}
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <p>🎉 恭喜！你的 Tauri + React Router 应用正在运行！</p>
        <ul>
          <li>✅ Tauri 后端已连接</li>
          <li>✅ React Router 路由正常</li>
          <li>✅ 前端界面渲染成功</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
