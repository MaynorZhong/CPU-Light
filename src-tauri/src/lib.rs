use std::{collections::HashMap, process::Command, time::Duration};

use regex::Regex;
use tauri::{path::BaseDirectory, Manager};

use anyhow::Context;
use serde::{Deserialize, Serialize};
use std::fs;
use std::net::IpAddr;
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

    // 当前原始容量
    pub apple_raw_current_capacity: Option<u64>,

    // 原始最大容量
    pub apple_raw_max_capacity: Option<u64>,
    // 设计容量
    pub design_capacity: Option<u32>,

    // 当前容量 最大容量
    pub current_capacity: Option<u32>,
    pub max_capacity: Option<u32>,

    pub time_to_full_seconds: Option<u32>,
    pub time_to_empty_seconds: Option<u32>,

    /// 电压 mv（如果能拿到）
    pub voltage: Option<f32>,

    /// 温度 °C（如果能拿到）
    pub temperature_c: Option<f32>,

    /// 循环次数（如果能拿到）
    pub cycle_count: Option<u32>,
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

    if pm_stdout
        .to_lowercase()
        .contains("now drawing from 'ac power'")
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
    let mut design_capacity: Option<u32> = None;
    let mut current_capacity: Option<u32> = None;
    let mut max_capacity: Option<u32> = None;
    let mut temp_c: Option<f32> = None;
    let mut voltage: Option<f32> = None;
    let mut serial: Option<String> = None;
    let mut model: Option<String> = None;
    let mut vendor: Option<String> = None;
    let mut apple_raw_current_capacity: Option<u64> = None;
    let mut apple_raw_max_capacity: Option<u64> = None;
    let mut avg_time_to_full: Option<u32> = None;
    let mut remain_time: Option<u32> = None;
    let mut is_charging: bool = false;

    for cap in kv_re.captures_iter(&ioreg_out) {
        let key = cap.name("k").unwrap().as_str();
        let val_raw = cap.name("v").unwrap().as_str().trim();

        match key {
            "CycleCount" => {
                if let Ok(n) = val_raw.parse::<u32>() {
                    cycle_count = Some(n);
                }
            }
            "AvgTimeToFull" => {
                if let Ok(n) = val_raw.parse::<u32>() {
                    if is_charging {
                        avg_time_to_full = Some(n * 60); // minutes to seconds
                    } else {
                        avg_time_to_full = None;
                    }
                }
            }
            "TimeRemaining" => {
                if let Ok(n) = val_raw.parse::<u32>() {
                    remain_time = Some(n * 60); // minutes to seconds
                }
            }
            "AppleRawCurrentCapacity" => {
                if let Ok(n) = val_raw.parse::<u64>() {
                    apple_raw_current_capacity = Some(n);
                }
            }
            "AppleRawMaxCapacity" => {
                if let Ok(n) = val_raw.parse::<u64>() {
                    apple_raw_max_capacity = Some(n);
                }
            }
            // 单位mAh/mWh，非 Wh
            "DesignCapacity" => {
                if let Ok(n) = val_raw.parse::<u32>() {
                    design_capacity = Some(n);
                } // ioreg often in mAh/mWh — best-effort convert
            }
            "MaxCapacity" | "MaxCapacityOperation" => {
                if let Ok(n) = val_raw.parse::<u32>() {
                    max_capacity = Some(n);
                }
            }
            "CurrentCapacity" | "CurrentCapacityOperation" => {
                if let Ok(n) = val_raw.parse::<u32>() {
                    current_capacity = Some(n);
                }
            }
            "IsCharging" => {
                if let Ok(n) = val_raw.parse::<bool>() {
                    is_charging = n;
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
                    // mV
                    voltage = Some(n);
                }
            }
            "Serial" | "BatterySerial" => {
                // remove quotes if present
                let cleaned = val_raw.trim_matches('"').to_string();
                if !cleaned.is_empty() {
                    serial = Some(cleaned);
                }
            }
            "DeviceName" | "Model" => {
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
        apple_raw_current_capacity,
        apple_raw_max_capacity,
        percentage,
        current_capacity,
        max_capacity,
        design_capacity,
        voltage,
        temperature_c: temp_c,
        cycle_count,
        time_to_full_seconds: avg_time_to_full,
        time_to_empty_seconds: remain_time,
    };

    Ok(BatteryInfo {
        batteries: vec![b],
        timestamp_unix: now,
    })
}

#[derive(Serialize)]
pub struct InterfaceInfo {
    pub name: String,
    pub mac: Option<String>,
    pub ips: Vec<String>,
    pub is_up: bool,
    pub is_loopback: bool,
    pub mtu: Option<u32>,
}

#[derive(Serialize)]
pub struct WifiInfo {
    pub ssid: Option<String>,
    pub bssid: Option<String>,
    pub signal_dbm: Option<i32>,
    pub frequency_mhz: Option<u32>,
    pub iface: Option<String>,
}

#[derive(Serialize)]
pub struct MacNetworkStatus {
    pub interfaces: Vec<InterfaceInfo>,
    pub online: bool,
    pub default_gateway: Option<String>,
    pub dns_servers: Vec<String>,
    pub wifi: Option<WifiInfo>,
    pub public_ip: Option<String>,
}

#[tauri::command]
async fn get_network_status(include_public_ip: Option<bool>) -> Result<MacNetworkStatus, String> {
    let include_public = include_public_ip.unwrap_or(false);
    fetch_network_status_macos(include_public)
        .await
        .map_err(|e| format!("fetch error: {:?}", e))
}

// ---------- 主逻辑 (async) ----------
async fn fetch_network_status_macos(include_public: bool) -> anyhow::Result<MacNetworkStatus> {
    println!("include_public {:?}", include_public);
    let interfaces = gather_interfaces_via_ifconfig().context("gather interfaces failed")?;
    let wifi = get_wifi_info().ok().flatten();
    let default_gateway = get_default_gateway().ok().flatten();
    let dns_servers = get_dns_servers().unwrap_or_default();
    let online = is_online_simple();
    let public_ip = if include_public && online {
        get_public_ip().await.ok()
    } else {
        None
    };

    Ok(MacNetworkStatus {
        interfaces,
        online,
        default_gateway,
        dns_servers,
        wifi,
        public_ip,
    })
}

// ---------- 新实现：用 ifconfig -a 解析接口 ----------
fn gather_interfaces_via_ifconfig() -> anyhow::Result<Vec<InterfaceInfo>> {
    // run `ifconfig -a` and parse blocks per interface
    let out = Command::new("ifconfig")
        .arg("-a")
        .output()
        .context("running ifconfig -a")?;
    if !out.status.success() {
        return Err(anyhow::anyhow!("ifconfig failed"));
    }
    let txt = String::from_utf8_lossy(&out.stdout).to_string();

    // Split into interface blocks. On macOS, interface header looks like:
    // en0: flags=... mtu 1500
    //     inet 192.168.1.10 netmask 0xffffff00 broadcast 192.168.1.255
    //     inet6 ...
    //     ether aa:bb:cc:dd:ee:ff
    //
    let header_re = Regex::new(r"(?m)^([0-9A-Za-z._-]+):\s+flags=.*?mtu\s+(\d+)").unwrap();
    let inet_re = Regex::new(r"(?m)^\s+inet\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)").unwrap();
    let inet6_re = Regex::new(r"(?m)^\s+inet6\s+([0-9a-fA-F:]+)").unwrap();
    let ether_re = Regex::new(r"(?m)^\s+ether\s+([0-9a-fA-F:]{17})").unwrap();
    let status_active_re = Regex::new(r"(?mi)status:\s*active").unwrap();
    let up_flag_re = Regex::new(r"(?m)flags=[0-9]+<([^>]+)>").unwrap();

    // We'll iterate through header matches, take substring from header.start to next header.start
    let mut interfaces = Vec::new();
    let mut positions: Vec<(usize, String, u32)> = Vec::new(); // (start_idx,name,mtu)

    for cap in header_re.captures_iter(&txt) {
        if let (Some(m0), Some(m1)) = (cap.get(0), cap.get(1)) {
            let start = m0.start();
            let name = m1.as_str().to_string();
            let mtu: u32 = cap
                .get(2)
                .and_then(|m| m.as_str().parse::<u32>().ok())
                .unwrap_or(0);
            positions.push((start, name, mtu));
        }
    }

    // sort by start just in case
    positions.sort_by_key(|p| p.0);

    for (i, (start, name, mtu_val)) in positions.iter().enumerate() {
        let end = if i + 1 < positions.len() {
            positions[i + 1].0
        } else {
            txt.len()
        };
        let block = &txt[*start..end];

        // parse ips
        let mut ips: Vec<String> = Vec::new();
        for cap in inet_re.captures_iter(block) {
            if let Some(ip) = cap.get(1) {
                ips.push(ip.as_str().to_string());
            }
        }
        for cap in inet6_re.captures_iter(block) {
            if let Some(ip) = cap.get(1) {
                ips.push(ip.as_str().to_string());
            }
        }

        // mac
        let mac = ether_re
            .captures(block)
            .and_then(|c| c.get(1).map(|m| m.as_str().to_ascii_lowercase()));

        // is_up: check status: active OR flags contain "UP" or "RUNNING"
        let is_up = status_active_re.is_match(block)
            || up_flag_re
                .captures(block)
                .map(|c| c.get(1).map(|m| m.as_str().to_string()))
                .flatten()
                .map(|s| {
                    s.split(',')
                        .any(|f| f.eq_ignore_ascii_case("UP") || f.eq_ignore_ascii_case("RUNNING"))
                })
                .unwrap_or(false);

        // is_loopback heuristics: name starts with lo or block contains "LOOPBACK"
        let is_loopback = name.starts_with("lo") || block.to_lowercase().contains("loopback");

        let mtu = if *mtu_val > 0 { Some(*mtu_val) } else { None };

        interfaces.push(InterfaceInfo {
            name: name.clone(),
            mac,
            ips,
            is_up,
            is_loopback,
            mtu,
        });
    }

    // sort for determinism
    interfaces.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(interfaces)
}

// 使用 scutil --nwi + networksetup -getairportnetwork <iface> 的实现
fn get_wifi_info() -> anyhow::Result<Option<WifiInfo>> {
    // 1) 先用 scutil --nwi 找出 primary interface（比如 en0/en1）
    let scutil_out = Command::new("scutil")
        .arg("--nwi")
        .output()
        .context("running scutil --nwi")?;

    if !scutil_out.status.success() {
        return Ok(None);
    }
    let sc = String::from_utf8_lossy(&scutil_out.stdout);

    // 常见行: "primary interface: en0"
    let re_primary = Regex::new(r"(?mi)primary interface:\s*([0-9A-Za-z._-]+)").unwrap();
    let primary_iface = re_primary
        .captures(&sc)
        .and_then(|c| c.get(1).map(|m| m.as_str().to_string()));

    // 如果 scutil 没给出 primary interface，尝试用 "PrimaryInterface"（某些 macOS 版本/语言）
    let primary_iface = primary_iface.or_else(|| {
        let re2 = Regex::new(r"(?mi)PrimaryInterface\s*:\s*([0-9A-Za-z._-]+)").unwrap();
        re2.captures(&sc)
            .and_then(|c| c.get(1).map(|m| m.as_str().to_string()))
    });

    // 2) 如果拿到接口名，调用 networksetup -getairportnetwork <iface> 获取 SSID
    let mut ssid: Option<String> = None;
    let mut iface_name: Option<String> = primary_iface.clone();

    if let Some(iface) = primary_iface {
        // networksetup -getairportnetwork <iface>
        let out = Command::new("networksetup")
            .arg("-getairportnetwork")
            .arg(&iface)
            .output()
            .context("running networksetup -getairportnetwork")?;

        if out.status.success() {
            let s = String::from_utf8_lossy(&out.stdout);
            // 成功样例: "Current Wi-Fi Network: MySSID"
            if let Some(cap) = Regex::new(r"(?mi)Current Wi-?Fi Network:\s*(.+)$")
                .unwrap()
                .captures(&s)
            {
                let v = cap.get(1).unwrap().as_str().trim().to_string();
                if !v.is_empty() {
                    ssid = Some(v);
                }
            } else {
                // 另一种样例: "You are not associated with an AirPort network."
                // 则 ssid 保持 None
            }
        } else {
            // networksetup 可能在某些系统版本需要不同权限；若失败，不立刻返回失败，后面再尝试 fallback
            iface_name = Some(iface); // keep iface anyway
        }
    }

    // 3) fallback：如果没有 primary iface 或 networksetup 失败，尝试找所有 en* 接口并对每个调用 networksetup
    if ssid.is_none() {
        // 用 ifconfig -a 找到可能的 wifi 接口（en0/en1/en2），按常见顺序尝试
        if let Ok(out_if) = Command::new("ifconfig").arg("-a").output() {
            if out_if.status.success() {
                let txt = String::from_utf8_lossy(&out_if.stdout);
                // 找所有以 en 开头的接口名
                let re_iface = Regex::new(r"(?m)^([en][0-9]+):").unwrap();
                for cap in re_iface.captures_iter(&txt) {
                    if let Some(ifn) = cap.get(1) {
                        let cand = ifn.as_str();
                        // call networksetup -getairportnetwork <cand>
                        if let Ok(out2) = Command::new("networksetup")
                            .arg("-getairportnetwork")
                            .arg(cand)
                            .output()
                        {
                            if out2.status.success() {
                                let s = String::from_utf8_lossy(&out2.stdout);
                                if let Some(cap2) =
                                    Regex::new(r"(?mi)Current Wi-?Fi Network:\s*(.+)$")
                                        .unwrap()
                                        .captures(&s)
                                {
                                    let v = cap2.get(1).unwrap().as_str().trim().to_string();
                                    if !v.is_empty() {
                                        ssid = Some(v);
                                        iface_name = Some(cand.to_string());
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 4) 返回 WifiInfo：此方案只能保证 SSID + iface，BSSID/RSSI/frequency 无法通过 networksetup 获取 -> 返回 None
    Ok(Some(WifiInfo {
        ssid,
        bssid: None,
        signal_dbm: None,
        frequency_mhz: None,
        iface: iface_name,
    }))
}

// ---------- default gateway ----------
fn get_default_gateway() -> anyhow::Result<Option<String>> {
    let out = Command::new("route")
        .args(&["-n", "get", "default"])
        .output()
        .context("route get default")?;
    if !out.status.success() {
        return Ok(None);
    }
    let s = String::from_utf8_lossy(&out.stdout);
    let re = Regex::new(r"gateway:\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)").unwrap();
    if let Some(cap) = re.captures(&s) {
        return Ok(Some(cap.get(1).unwrap().as_str().to_string()));
    }
    Ok(None)
}

// ---------- dns servers ----------
fn get_dns_servers() -> Option<Vec<String>> {
    let out = Command::new("scutil").arg("--dns").output().ok()?;
    if !out.status.success() {
        return None;
    }
    let s = String::from_utf8_lossy(&out.stdout);
    let re = Regex::new(r"nameserver\[[0-9]+\]\s*:\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)").unwrap();
    let mut v = Vec::new();
    for cap in re.captures_iter(&s) {
        v.push(cap.get(1).unwrap().as_str().to_string());
    }
    v.sort();
    v.dedup();
    Some(v)
}

// ---------- online check ----------
fn is_online_simple() -> bool {
    use std::net::TcpStream;
    if let Ok(addr) = "1.1.1.1:53".parse() {
        if let Ok(_) = TcpStream::connect_timeout(&addr, Duration::from_millis(800)) {
            return true;
        }
    }
    false
}

// ---------- public ip (optional) ----------
async fn get_public_ip() -> anyhow::Result<String> {
    #[derive(serde::Deserialize, Debug)]
    struct Ipify {
        ip: String,
    }
    use std::time::Instant;
    let now = Instant::now();
    let resp = reqwest::get("https://api64.ipify.org?format=json").await;
    eprintln!(
        "reqwest get result: {:?}, elapsed: {:?}",
        resp,
        now.elapsed()
    );
    let res_ip = resp?.json::<Ipify>().await?;
    eprintln!("json parsed: {:?}", res_ip);

    Ok(res_ip.ip)
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
            get_battery_info,
            get_network_status
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
