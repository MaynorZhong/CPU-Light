use serde::{Deserialize, Serialize};

// 导入 tray 模块
mod tray;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Deserialize, Serialize)]
struct ErrorReport {
    message: String,
    stack: Option<String>,
    name: String,
    timestamp: String,
    user_agent: String,
    url: String,
    component_stack: Option<String>,
    error_id: Option<String>,
    user_id: Option<String>,
    session_id: Option<String>,
    build_version: Option<String>,
}

#[tauri::command]
fn log_error(error: ErrorReport) -> Result<(), String> {
    // 记录错误到日志文件
    log::error!(
        "Frontend Error [{}]: {} - {} at {}",
        error.name,
        error.message,
        error.error_id.unwrap_or_else(|| "unknown".to_string()),
        error.timestamp
    );

    if let Some(stack) = &error.stack {
        log::error!("Stack trace: {}", stack);
    }

    if let Some(component_stack) = &error.component_stack {
        log::error!("Component stack: {}", component_stack);
    }

    // 可以在这里添加更多的错误处理逻辑
    // 比如发送到远程日志服务、写入数据库等

    log::info!("Error logged successfully");
    Ok(())
}

#[tauri::command]
async fn get_system_info() -> Result<serde_json::Value, String> {
    let info = serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "version": env!("CARGO_PKG_VERSION"),
        "name": env!("CARGO_PKG_NAME"),
    });

    Ok(info)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, log_error, get_system_info])
        .setup(|app| {
            // 创建系统托盘
            if let Err(e) = tray::create_tray(app) {
                log::error!("Failed to create tray: {}", e);
            } else {
                log::info!("Tray created successfully");
            }

            log::info!("Application started successfully");
            log::info!("App version: {}", app.package_info().version);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
