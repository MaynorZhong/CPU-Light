use std::{collections::HashMap, process::Command};

use regex::Regex;
use tauri::{path::BaseDirectory, Manager};

use anyhow::Context;
use serde::{Deserialize, Serialize};
use std::fs;
use sysinfo::{Disks, System};

// 导入 tray 模块
mod tray;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Deserialize, Serialize)]
struct MacOSMapEntry {
    product_version: String,
    marketing_name: String,
}

#[tauri::command]
fn get_product_version() -> Option<String> {
    let out = Command::new("sw_vers")
        .arg("-productVersion")
        .output()
        .ok()?;
    Some(String::from_utf8_lossy(&out.stdout).trim().to_string())
}
#[tauri::command]
fn load_map(handle: tauri::AppHandle) -> Vec<MacOSMapEntry> {
    // 尝试解析资源路径
    let resource_path = handle
        .path()
        .resolve("resources/macos_version_map.json", BaseDirectory::Resource);

    print!("Resource path: {:?}", resource_path);

    let s = fs::read_to_string(resource_path.unwrap()).unwrap_or_default();

    let map: HashMap<String, String> = serde_json::from_str(&s).unwrap_or_default();
    map.into_iter()
        .map(|(product_version, marketing_name)| MacOSMapEntry {
            product_version,
            marketing_name,
        })
        .collect()
}

#[tauri::command]
fn find_marketing_name(ver: &str, map: &[MacOSMapEntry]) -> Option<String> {
    map.iter()
        .find(|e| e.product_version == ver)
        .map(|e| e.marketing_name.clone())
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

#[derive(Serialize, Deserialize, Debug)]
struct SystemInfo {
    os_name: Option<String>,
    os_version: Option<String>,
    kernel_version: Option<String>,
    cpu_count: usize,
    total_memory_mb: u64,
    available_memory_mb: u64,
    hostname: Option<String>,
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
fn get_system_info() -> Result<SystemInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let sysinfo = SystemInfo {
        os_name: System::name(),
        os_version: System::os_version(),
        kernel_version: System::kernel_version(),
        cpu_count: sys.cpus().len(),
        total_memory_mb: sys.total_memory() / 1024,
        available_memory_mb: sys.available_memory() / 1024,
        hostname: System::host_name(),
    };
    Ok(sysinfo)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DeviceInfo {
    pub serial_number: Option<String>,
    pub hardware_uuid: Option<String>,
    pub model_identifier: Option<String>,
    pub boot_time_utc: Option<String>, // ISO8601
    pub uptime_seconds: u64,
}

fn run_cmd_out(cmd: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(cmd).args(args).output().ok()?;
    let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
    s.is_empty().then(|| None).unwrap_or(Some(s))
}

fn ioreg_get_property(key: &str) -> Option<String> {
    let out = run_cmd_out("ioreg", &["-rd1", "-c", "IOPlatformExpertDevice"])?;
    // 支持 "key" = "value" 或 "key" = <"value">
    let pattern = format!(
        r#""{}"\s*=\s*(?:"([^"]+)"|<"([^"]+)">|<([0-9a-fA-F ]+)>)"#,
        regex::escape(key)
    );
    let re = Regex::new(&pattern).ok()?;
    re.captures(&out).and_then(|cap| {
        // 优先匹配字符串
        cap.get(1)
            .or_else(|| cap.get(2))
            .map(|m| m.as_str().to_string())
            // 如果是16进制字节，尝试转成字符串
            .or_else(|| {
                cap.get(3).and_then(|m| {
                    let bytes: Vec<u8> = m
                        .as_str()
                        .split_whitespace()
                        .filter_map(|b| u8::from_str_radix(b, 16).ok())
                        .collect();
                    String::from_utf8(bytes).ok()
                })
            })
    })
}

#[tauri::command]
fn get_device_info() -> DeviceInfo {
    let serial_number = ioreg_get_property("IOPlatformSerialNumber");
    let hardware_uuid = ioreg_get_property("IOPlatformUUID");
    let model_identifier = ioreg_get_property("model");
    let boot_time_str = run_cmd_out("sysctl", &["-n", "kern.boottime"]);
    let boot_time_utc = boot_time_str.and_then(|s| {
        let re = Regex::new(r#"\{ sec = (\d+),"#).ok()?;
        re.captures(&s)
            .and_then(|cap| cap.get(1).map(|m| m.as_str().to_string()))
            .and_then(|sec_str| sec_str.parse::<i64>().ok())
            .and_then(|secs| {
                let dt = chrono::NaiveDateTime::from_timestamp_opt(secs, 0)?;
                Some(dt.format("%Y-%m-%dT%H:%M:%SZ").to_string())
            })
    });

    let uptime_seconds = sysinfo::System::uptime();

    DeviceInfo {
        serial_number,
        hardware_uuid,
        model_identifier,
        boot_time_utc,
        uptime_seconds,
    }
}

#[derive(Debug, Serialize, Deserialize)]

pub struct HardwareData {
    model_name: Option<String>,
    model_identifier: Option<String>,
    model_number: Option<String>,
    chip: Option<String>,
    total_number_of_cores: Option<String>,
    memory: Option<String>,
    system_firmware_version: Option<String>,
    os_loader_version: Option<String>,
    serial_number_system: Option<String>,
    hardware_uuid: Option<String>,
    provisioning_udid: Option<String>,
    activation_lock_status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct DiskInfo {
    name: String,
    mount_point: String,
    total: u64,
    available: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct Temps {
    cpu: Option<f32>,
    gpu: Option<f32>,
    others: Vec<(String, f32)>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemMetrics {
    cpu_usage_percent: f32, // 0.0..100.0
    total_memory_kb: u64,
    used_memory_kb: u64,
    disks: Vec<DiskInfo>,
    temps: Option<Temps>,
}

#[tauri::command]
fn get_system_metrics() -> Result<SystemMetrics, String> {
    // --- 1. 基本信息：cpu/memory/disk（使用 sysinfo） ---
    let mut sys = System::new_all();

    sys.refresh_all();

    let cpu_usage =
        sys.cpus().iter().map(|c| c.cpu_usage()).sum::<f32>() / (sys.cpus().len() as f32);

    sys.refresh_all();

    let total_memory = sys.total_memory(); // KB
    let used_memory = sys.used_memory(); // KB

    let disks = Disks::new_with_refreshed_list()
        .iter()
        .map(|d| DiskInfo {
            name: d.name().to_string_lossy().into_owned(),
            mount_point: d.mount_point().to_string_lossy().into_owned(),
            total: d.total_space(),
            available: d.available_space(),
        })
        .collect::<Vec<_>>();

    // let disks = sys
    //     .disks()
    //     .iter()
    //     .map(|d| DiskInfo {
    //         name: d.name().to_string_lossy().into_owned(),
    //         mount_point: d.mount_point().to_string_lossy().into_owned(),
    //         total: d.total_space(),
    //         available: d.available_space(),
    //     })
    //     .collect::<Vec<_>>();

    // --- 2. 温度信息：平台差异处理（best-effort） ---
    #[cfg(target_os = "macos")]
    let temps = macos_try_get_temps();

    Ok(SystemMetrics {
        cpu_usage_percent: cpu_usage,
        total_memory_kb: total_memory,
        used_memory_kb: used_memory,
        disks,
        temps,
    })
}

#[tauri::command]
fn get_hardware_data() -> Result<HardwareData, String> {
    let output = Command::new("system_profiler")
        .args(&["-json", "SPHardwareDataType"])
        .output()
        .map_err(|e| format!("failed to run system_profiler: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("system_profiler failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // system_profiler -json SPHardwareDataType 的输出是 { "SPHardwareDataType": [ { ... } ] }
    let v: serde_json::Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("failed to parse JSON from system_profiler: {}", e))?;

    // 保险地从 JSON 中提取字段
    let hw = v
        .get("SPHardwareDataType")
        .and_then(|arr| arr.get(0))
        .ok_or_else(|| "unexpected JSON structure".to_string())?;

    let get_str = |key: &str| hw.get(key).and_then(|s| s.as_str()).map(|s| s.to_string());

    Ok(HardwareData {
        model_name: get_str("machine_name").or_else(|| get_str("Model Name")), // 兼容性尝试
        model_identifier: get_str("machine_model").or_else(|| get_str("Model Identifier")),
        model_number: get_str("Model Number"),
        chip: get_str("chip_type").or_else(|| get_str("Chip")),
        total_number_of_cores: get_str("number_processors")
            .or_else(|| get_str("Total Number of Cores"))
            .or_else(|| hw.get("Total Number of Cores").map(|x| x.to_string())),
        memory: get_str("physical_memory").or_else(|| get_str("Memory")),
        system_firmware_version: get_str("system_firmware_version")
            .or_else(|| get_str("System Firmware Version")),
        os_loader_version: get_str("os_loader_version").or_else(|| get_str("OS Loader Version")),
        serial_number_system: get_str("serial_number")
            .or_else(|| get_str("Serial Number (system)")),
        hardware_uuid: get_str("hardware_uuid").or_else(|| get_str("Hardware UUID")),
        provisioning_udid: get_str("provisioning_udid").or_else(|| get_str("Provisioning UDID")),
        activation_lock_status: get_str("activation_lock_status")
            .or_else(|| get_str("Activation Lock Status")),
    })
}

// 辅助：从字符串中提取第一个浮点数（如 "CPU die temperature: 69.54 C" -> 69.54）
fn extract_first_float(s: &str) -> Option<f32> {
    let mut num = String::new();
    let mut in_num = false;
    for ch in s.chars() {
        if ch.is_digit(10) || ch == '.' || ch == '-' {
            num.push(ch);
            in_num = true;
        } else if in_num {
            break;
        }
    }
    if num.is_empty() {
        None
    } else {
        num.parse::<f32>().ok()
    }
}

#[cfg(target_os = "macos")]
fn macos_try_get_temps() -> Option<Temps> {
    // powermetrics 通常需要 root 权限，输出中包含 "CPU die temperature"
    // best-effort: 尝试直接运行 powermetrics; 如果失败返回 None 并在前端提示用户权限或安装 helper
    let out = Command::new("powermetrics")
        .args(&["--samplers", "smc", "-i1", "-n1"])
        .output();

    let output = match out {
        Ok(o) if o.status.success() => String::from_utf8_lossy(&o.stdout).into_owned(),
        Ok(o) => {
            // 可能是没有权限或者 powermetrics 没有输出 smc
            let stderr = String::from_utf8_lossy(&o.stderr).into_owned();
            // 返回 None（前端可显示 stderr 做提示）
            eprintln!("powermetrics failed: {}", stderr);
            return None;
        }
        Err(e) => {
            eprintln!("failed to run powermetrics: {}", e);
            return None;
        }
    };

    // 解析文本，找 "CPU die temperature: 69.54 C" 之类
    let mut cpu_temp: Option<f32> = None;
    let mut gpu_temp: Option<f32> = None;
    let mut others = Vec::new();

    for line in output.lines() {
        let l = line.trim();
        if l.to_lowercase().contains("cpu die temperature")
            || l.to_lowercase().contains("cpu temperature")
        {
            if let Some(num) = extract_first_float(l) {
                cpu_temp = Some(num);
            }
        } else if l.to_lowercase().contains("gpu die temperature")
            || l.to_lowercase().contains("gpu temperature")
        {
            if let Some(num) = extract_first_float(l) {
                gpu_temp = Some(num);
            }
        } else if l.to_lowercase().contains("temperature") {
            if let Some(num) = extract_first_float(l) {
                others.push((l.to_string(), num));
            }
        }
    }

    Some(Temps {
        cpu: cpu_temp,
        gpu: gpu_temp,
        others,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SingleBattery {
    pub vendor: Option<String>,
    pub model: Option<String>,
    pub serial_number: Option<String>,

    /// Charging / Discharging / Full / Unknown
    pub state: String,

    /// 0.0 - 100.0
    pub percentage: Option<f32>,

    /// 单位 Wh（如果能拿到）
    pub energy_wh: Option<f32>,
    pub energy_full_wh: Option<f32>,
    pub energy_design_wh: Option<f32>,

    /// 电压 V（如果能拿到）
    pub voltage: Option<f32>,

    /// 温度 °C（如果能拿到）
    pub temperature_c: Option<f32>,

    /// 循环次数（如果能拿到）
    pub cycle_count: Option<u32>,

    /// 估算到满/空的秒数（如果能拿到）
    pub time_to_full_seconds: Option<u64>,
    pub time_to_empty_seconds: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatteryInfo {
    pub batteries: Vec<SingleBattery>,
    pub timestamp_unix: u64,
}

/// 主 async 命令，前端调用 invoke("get_battery_info")
#[tauri::command]
async fn get_battery_info() -> Result<BatteryInfo, String> {
    let res = tauri::async_runtime::spawn_blocking(move || fetch_battery_blocking()).await;
    match res {
        Ok(Ok(info)) => Ok(info),
        Ok(Err(e)) => Err(format!("fetch battery error: {:?}", e)),
        Err(e) => Err(format!("task join error: {:?}", e)),
    }
}

/// 阻塞实现：按平台分别获取
fn fetch_battery_blocking() -> anyhow::Result<BatteryInfo> {
    #[cfg(target_os = "macos")]
    {
        fetch_battery_macos().context("macOS battery fetch failed")
    }
}

fn fetch_battery_macos() -> anyhow::Result<BatteryInfo> {
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    // 1) 尝试用 pmset -g batt 获取 percentage 与 charging state（文本）
    let pm = Command::new("pmset")
        .arg("-g")
        .arg("batt")
        .output()
        .context("failed to run pmset")?;

    let pm_stdout = String::from_utf8_lossy(&pm.stdout);
    // pmset 输出示例行可能包含 "93%; discharging;" 或 "Now drawing from 'AC Power'"
    let mut percentage: Option<f32> = None;
    let mut state: String = "Unknown".to_string();
    // 匹配 0-100%
    if let Some(cap) = Regex::new(r"(\d{1,3})%")
        .unwrap()
        .captures(&pm_stdout)
        .and_then(|c| c.get(1))
    {
        if let Ok(v) = cap.as_str().parse::<f32>() {
            percentage = Some(v);
        }
    }
    if pm_stdout.to_lowercase().contains("charging")
        || pm_stdout.to_lowercase().contains("now drawing from 'ac'")
    {
        state = "Charging".to_string();
    } else if pm_stdout.to_lowercase().contains("discharging")
        || pm_stdout.to_lowercase().contains("battery power")
    {
        state = "Discharging".to_string();
    } else if pm_stdout.to_lowercase().contains("charged")
        || pm_stdout.to_lowercase().contains("full")
    {
        state = "Full".to_string();
    }

    // 2) 用 ioreg 获取更多字段（CycleCount, DesignCapacity, MaxCapacity/CurrentCapacity, Temperature）
    // ioreg 输出行形如: | | "CycleCount" = 123
    let ioreg = Command::new("ioreg")
        .args(&["-rn", "AppleSmartBattery"])
        .output()
        .context("failed to run ioreg")?;
    let ioreg_out = String::from_utf8_lossy(&ioreg.stdout);

    let kv_re = Regex::new(r#"\"(?P<k>[A-Za-z0-9_]+)\"\s+=\s+(?P<v>.+)"#).unwrap();

    let mut cycle_count: Option<u32> = None;
    let mut design_capacity_wh: Option<f32> = None;
    let mut current_capacity_wh: Option<f32> = None;
    let mut max_capacity_wh: Option<f32> = None;
    let mut temp_c: Option<f32> = None;
    let mut voltage_v: Option<f32> = None;
    let mut serial: Option<String> = None;
    let mut model: Option<String> = None;
    let mut vendor: Option<String> = None;

    for cap in kv_re.captures_iter(&ioreg_out) {
        let key = cap.name("k").unwrap().as_str();
        let val_raw = cap.name("v").unwrap().as_str().trim();

        match key {
            "CycleCount" => {
                if let Ok(n) = val_raw.parse::<u32>() {
                    cycle_count = Some(n);
                }
            }
            "DesignCapacity" => {
                if let Ok(n) = val_raw.parse::<f32>() {
                    design_capacity_wh = Some(n / 1000.0);
                } // ioreg often in mAh/mWh — best-effort convert
            }
            "MaxCapacity" | "MaxCapacityOperation" => {
                if let Ok(n) = val_raw.parse::<f32>() {
                    max_capacity_wh = Some(n / 1000.0);
                }
            }
            "CurrentCapacity" | "CurrentCapacityOperation" => {
                if let Ok(n) = val_raw.parse::<f32>() {
                    current_capacity_wh = Some(n / 1000.0);
                }
            }
            "Temperature" => {
                // ioreg temperature sometimes in 0.1 C units
                if let Ok(n) = val_raw.parse::<f32>() {
                    // Heuristic: if > 1000 likely 0.1C format; else assume C
                    temp_c = Some(if n > 1000.0 { n / 100.0 } else { n / 1.0 });
                }
            }
            "Voltage" => {
                if let Ok(n) = val_raw.parse::<f32>() {
                    // often in mV
                    voltage_v = Some(if n > 1000.0 { n / 1000.0 } else { n });
                }
            }
            "SerialNumber" | "BatterySerial" => {
                // remove quotes if present
                let cleaned = val_raw.trim_matches('"').to_string();
                if !cleaned.is_empty() {
                    serial = Some(cleaned);
                }
            }
            "ProductName" | "Model" => {
                let cleaned = val_raw.trim_matches('"').to_string();
                if !cleaned.is_empty() {
                    model = Some(cleaned);
                }
            }
            "Manufacturer" | "BatteryManufacturer" => {
                let cleaned = val_raw.trim_matches('"').to_string();
                if !cleaned.is_empty() {
                    vendor = Some(cleaned);
                }
            }
            _ => {}
        }
    }

    // 时间估算（pmset 可能给出 estimate, 但解析 pmset 复杂；这里不做复杂估计）
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // 构造 SingleBattery（mac 一般只有一块 internal battery）
    let b = SingleBattery {
        vendor,
        model,
        serial_number: serial,
        state,
        percentage,
        energy_wh: current_capacity_wh,
        energy_full_wh: max_capacity_wh,
        energy_design_wh: design_capacity_wh,
        voltage: voltage_v,
        temperature_c: temp_c,
        cycle_count,
        time_to_full_seconds: None,
        time_to_empty_seconds: None,
    };

    Ok(BatteryInfo {
        batteries: vec![b],
        timestamp_unix: now,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            log_error,
            get_system_info,
            load_map,
            get_device_info,
            get_hardware_data,
            get_system_metrics,
            get_battery_info
        ])
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
