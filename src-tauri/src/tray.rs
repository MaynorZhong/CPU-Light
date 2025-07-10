use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{App, Manager, Result};

pub fn create_tray(app: &App) -> Result<TrayIcon> {
    // 创建菜单项
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let show_item = MenuItem::with_id(app, "show", "打开", true, None::<&str>)?;

    // 创建菜单
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    // 创建托盘图标
    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("CPU Light - 系统监控")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                println!("quit menu item was clicked");
                app.exit(0);
                std::process::exit(0)
            }
            _ => {
                println!("menu item {:?} not handled", event.id);
            }
        })
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                println!("left click pressed and released");
                // 当双击托盘图标时，将展示并聚焦于主窗口
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {
                println!("unhandled event {event:?}");
            }
        })
        .build(app)?;

    Ok(tray)
}
