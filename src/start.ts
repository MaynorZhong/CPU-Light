import { invoke } from "@tauri-apps/api/core";

function sleep(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function setup() {
  console.log("前端应用启动..");
  // 这里放加载启动前的逻辑 比如数据预热 提前加载一些资源
  // 进行一些数据预热操作
  await sleep(3);
  console.log("前端应用启动完成");
  // 调用后端应用
  invoke("set_complete", { task: "frontend" });
}

export default () => {
  // Effectively a JavaScript main function
  window.addEventListener("DOMContentLoaded", () => {
    setup();
  });
};
