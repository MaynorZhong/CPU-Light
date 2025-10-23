// Import functionalities we'll be using

use tauri::{AppHandle, Manager, State};
use tokio::{
    sync::Mutex,
    time::{sleep, Duration},
};

// Create a struct we'll use to track the completion of
// setup related tasks
pub struct SetupState {
    pub(crate) frontend_task: bool,
    pub(crate) backend_task: bool,
}

// A custom task for setting the state of a setup task
#[tauri::command]
pub async fn set_complete(
    app: AppHandle,
    state: State<'_, Mutex<SetupState>>,
    task: String,
) -> Result<(), String> {
    // Lock the state without write access
    let mut state_lock = state.lock().await;
    match task.as_str() {
        "frontend" => state_lock.frontend_task = true,
        "backend" => state_lock.backend_task = true,
        _ => return Err("invalid task completed!".to_string()),
    }

    // 检查是否都完成
    if state_lock.backend_task && state_lock.frontend_task {
        // 安全地获取窗口
        if let Some(splash_window) = app.get_webview_window("splashscreen") {
            splash_window.close().map_err(|e| e.to_string())?;
        }

        // 如果只有一个窗口，直接导航到主页面
        if let Some(main_window) = app.get_webview_window("main") {
            main_window.show().map_err(|e| e.to_string())?;
        } else {
            // 没有 main 窗口，让 splashscreen 窗口导航到主页
            if let Some(window) = app.get_webview_window("splashscreen") {
                window
                    .navigate(tauri::Url::parse("tauri://localhost/").unwrap())
                    .map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}

// An async function that does some heavy setup task
pub async fn setup(app: AppHandle) -> Result<(), String> {
    // Fake performing some heavy action for 3 seconds
    println!("Performing really heavy backend setup task...");
    sleep(Duration::from_secs(3)).await;
    println!("Backend setup task completed!");

    set_complete(
        app.clone(),
        app.state::<Mutex<SetupState>>(),
        "backend".to_string(),
    )
    .await
}
