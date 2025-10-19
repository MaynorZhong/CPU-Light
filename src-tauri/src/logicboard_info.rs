// src-tauri/src/logicboard_info.rs
//! Logic board / 主板信息采集（macOS） - 改进版
//!
//! 通过 system_profiler / ioreg / sysctl / nvram 等命令收集逻辑板相关信息，
//! 并以 `LogicBoardInfo` 返回给前端。实现尽量稳健、容错不同机型/系统版本。
//!
//! 说明：需在 Cargo.toml 中包含 `regex = "1"` 以及 `serde = { features = ["derive"], version = "1" }`。

use regex::Regex;
use serde::Serialize;
use std::collections::HashMap;
use std::process::Command;
use tauri::command;

/// 主板信息结构体（序列化到前端）
/// 字段均为 Option，便于在不同机型或权限下安全返回。
#[derive(Serialize, Debug)]
pub struct LogicBoardInfo {
    /// 主板硬件 ID / board-id（如 Mac-742912EFDBEE19B3）
    pub board_id: Option<String>,

    /// 逻辑机型标识（Model Identifier），例如 "MacBookPro18,3" 或 "Mac16,1"
    pub model_identifier: Option<String>,

    /// 平台 UUID（IOPlatformUUID）
    pub platform_uuid: Option<String>,

    /// 硬件型号（hw.model）
    pub hardware_model: Option<String>,

    /// 机型架构（uname -m / hw.machine）
    pub machine_arch: Option<String>,

    /// 芯片/处理器型号字符串（来自 system_profiler，如 "Apple M4"）
    pub chip_type: Option<String>,

    /// 主板序列号（IOPlatformSerialNumber）
    pub serial_number: Option<String>,

    /// 固件版本（System Firmware Version / OS Loader Version / Boot ROM）
    pub firmware_version: Option<String>,

    /// 是否启用安全启动 / secure boot 信息（若可得）
    pub secure_boot: Option<String>,

    /// 桥接芯片（如 Apple T2）或其他安全协处理器信息（如果可得）
    pub bridge_chip: Option<String>,

    /// 逻辑板代号 / model number / board code（若能读取到）
    pub logic_board_code: Option<String>,

    /// 总核数（如 "10"），从 system_profiler 解析（如果可得）
    pub total_cores: Option<u32>,

    /// human-readable extras from SPHardwareDataType we parse for convenience
    pub sp_extras: Option<HashMap<String, String>>,

    /// 原始 system_profiler (SPHardwareDataType) 的键值表（便于调试）
    pub system_profiler_raw: Option<HashMap<String, String>>,

    /// 其它通过 ioreg / nvram / sysctl 读取到的原始键值（调试用途）
    pub debug_raw: Option<HashMap<String, String>>,
}

/// run command and return trimmed stdout string if success
fn run_cmd_trim(cmd: &str, args: &[&str]) -> Option<String> {
    let out = Command::new(cmd).args(args).output().ok()?;
    if !out.status.success() {
        return None;
    }
    String::from_utf8(out.stdout)
        .ok()
        .map(|s| s.trim().to_string())
}

/// run sysctl -n <key>
fn run_sysctl_n(key: &str) -> Option<String> {
    run_cmd_trim("sysctl", &["-n", key])
}

/// parse system_profiler SPHardwareDataType-ish text into map
fn parse_system_profiler_hardware(txt: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();

    for line in txt.lines() {
        // skip lines that are headers or empty
        let l = line.trim();
        if l.is_empty() {
            continue;
        }

        // typical key: "Model Identifier: Mac16,1"
        if let Some(pos) = l.find(':') {
            let (k, v) = l.split_at(pos);
            let key = k.trim().to_string();
            let val = v[1..].trim().to_string();
            if !key.is_empty() {
                map.insert(key, val);
            }
        } else {
            // sometimes lines are like "Chip: Apple M4" (already matched), else skip
            continue;
        }
    }

    map
}

/// parse ioreg -l output for quoted "key" = "value" patterns and some <hex> patterns
fn parse_ioreg_for_keys(txt: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    let re = Regex::new(r#""([^"]+)"\s*=\s*"([^"]+)""#).unwrap();
    for cap in re.captures_iter(txt) {
        let k = cap[1].to_string();
        let v = cap[2].to_string();
        map.insert(k, v);
    }

    // board-id sometimes appears as board-id = <hexblob>
    let re_board_hex = Regex::new(r#"board-id\s*=\s*<([0-9a-fA-F]+)>"#).unwrap();
    if let Some(cap) = re_board_hex.captures(txt) {
        map.entry("board-id".to_string())
            .or_insert(cap[1].to_string());
    }

    map
}

/// parse "Pages free/active/inactive" from vm_stat (not used here but useful for debug)
fn parse_vm_stat_pages(_txt: &str) -> (Option<u64>, Option<u64>, Option<u64>) {
    // kept for reference; not used in this file
    (None, None, None)
}

/// main collector (blocking)
fn collect_logicboard_info_blocking() -> Result<LogicBoardInfo, String> {
    // 1) system_profiler SPHardwareDataType (mini detail to reduce output size)
    let sp_out = run_cmd_trim(
        "system_profiler",
        &["-detailLevel", "mini", "SPHardwareDataType"],
    );
    let sp_map = sp_out.as_ref().map(|s| parse_system_profiler_hardware(s));

    // convenience extraction from sp_map
    let mut model_identifier = sp_map
        .as_ref()
        .and_then(|m| m.get("Model Identifier").cloned())
        .or_else(|| {
            sp_map
                .as_ref()
                .and_then(|m| m.get("Machine Model").cloned())
        });

    // chip_type could appear as "Chip", "Processor Name", "CPU Type"
    let mut chip_type = sp_map
        .as_ref()
        .and_then(|m| m.get("Chip").cloned())
        .or_else(|| {
            sp_map
                .as_ref()
                .and_then(|m| m.get("Processor Name").cloned())
        })
        .or_else(|| sp_map.as_ref().and_then(|m| m.get("CPU Type").cloned()));

    // Serial number candidate from system_profiler (if present)
    let mut serial_number = sp_map
        .as_ref()
        .and_then(|m| m.get("Serial Number (system)").cloned())
        .or_else(|| {
            sp_map
                .as_ref()
                .and_then(|m| m.get("Serial Number").cloned())
        });

    // firmware_version try multiple keys
    let mut firmware_version = sp_map
        .as_ref()
        .and_then(|m| m.get("System Firmware Version").cloned())
        .or_else(|| {
            sp_map
                .as_ref()
                .and_then(|m| m.get("OS Loader Version").cloned())
        })
        .or_else(|| {
            sp_map
                .as_ref()
                .and_then(|m| m.get("Boot ROM Version").cloned())
        })
        .or_else(|| {
            sp_map
                .as_ref()
                .and_then(|m| m.get("SMC Version (system)").cloned())
        });

    // Extract some extra SP fields we want to expose in sp_extras
    let mut sp_extras: HashMap<String, String> = HashMap::new();
    if let Some(ref map) = sp_map {
        for key in &[
            "Model Name",
            "Model Identifier",
            "Model Number",
            "Chip",
            "Total Number of Cores",
            "Memory",
            "System Firmware Version",
            "OS Loader Version",
            "Boot ROM Version",
        ] {
            if let Some(v) = map.get(*key) {
                sp_extras.insert(key.to_string(), v.clone());
            }
        }
    }

    // parse total cores if available like "10 (4 performance and 6 efficiency)"
    let mut total_cores: Option<u32> = None;
    if let Some(ref v) = sp_extras.get("Total Number of Cores") {
        let re = Regex::new(r#"(\d+)"#).unwrap();
        if let Some(cap) = re.captures(v) {
            if let Ok(n) = cap[1].parse::<u32>() {
                total_cores = Some(n);
            }
        }
    }

    // 2) ioreg -l parse many keys
    let ioreg_out = run_cmd_trim("ioreg", &["-l"]);
    let ioreg_map = ioreg_out.as_ref().map(|s| parse_ioreg_for_keys(s));

    let platform_uuid = ioreg_map
        .as_ref()
        .and_then(|m| m.get("IOPlatformUUID").cloned())
        .or_else(|| {
            ioreg_map
                .as_ref()
                .and_then(|m| m.get("platform-uuid").cloned())
        });

    let mut board_id = ioreg_map
        .as_ref()
        .and_then(|m| m.get("board-id").cloned())
        .or_else(|| {
            ioreg_map
                .as_ref()
                .and_then(|m| m.get("board-id64").cloned())
        });

    // 3) sysctl / uname
    let hardware_model = run_sysctl_n("hw.model"); // like Mac16,1
    let machine_arch = run_cmd_trim("uname", &["-m"]).or_else(|| run_sysctl_n("hw.machine"));

    // 4) gather IOPlatformExpertDevice info (复用结果)
    let ioreg_pe_out = run_cmd_trim("ioreg", &["-rd1", "-c", "IOPlatformExpertDevice"]);
    if let Some(ref ioreg_pe) = ioreg_pe_out {
        let re_sn = Regex::new(r#""IOPlatformSerialNumber"\s*=\s*"([^"]+)""#).unwrap();
        if serial_number.is_none() {
            if let Some(cap) = re_sn.captures(ioreg_pe) {
                serial_number = Some(cap[1].to_string());
            }
        }

        let re_board = Regex::new(r#""board-id"\s*=\s*"([^"]+)""#).unwrap();
        if board_id.is_none() {
            if let Some(cap) = re_board.captures(ioreg_pe) {
                board_id = Some(cap[1].to_string());
            } else {
                let re_board2 = Regex::new(r#"board-id\s*=\s*<([0-9a-fA-F]+)>"#).unwrap();
                if let Some(cap2) = re_board2.captures(ioreg_pe) {
                    board_id = Some(cap2[1].to_string());
                }
            }
        }
    }

    // 5) try to detect bridge chip (T2) from SPiBridgeDataType or ioreg
    let mut bridge_chip: Option<String> = None;
    if let Some(ibridge) = run_cmd_trim(
        "system_profiler",
        &["-detailLevel", "mini", "SPiBridgeDataType"],
    ) {
        if ibridge.contains("T2") || ibridge.contains("Apple T2") {
            bridge_chip = Some("Apple T2".to_string());
        } else {
            // try to parse Model line in that SP output
            for line in ibridge.lines() {
                if line.contains("Model:") {
                    if let Some(pos) = line.find(':') {
                        let val = line[pos + 1..].trim().to_string();
                        if !val.is_empty() {
                            bridge_chip = Some(val);
                            break;
                        }
                    }
                }
            }
        }
    }

    // 6) secure boot detection (best-effort)
    let mut secure_boot: Option<String> = None;
    // nvram might have secureboot-mode or csr-active-config
    if let Some(nv) = run_cmd_trim("nvram", &["-p"]) {
        if nv.contains("secureboot-mode") {
            // try find the line
            for line in nv.lines() {
                if line.contains("secureboot-mode") {
                    if let Some(v) = line.split_whitespace().last() {
                        secure_boot = Some(v.to_string());
                        break;
                    }
                }
            }
        } else {
            // try system_profiler SPHardwareDataType keys
            if let Some(ref spm) = sp_map {
                if let Some(sb) = spm.get("Secure Boot") {
                    secure_boot = Some(sb.clone());
                } else if let Some(sb2) = spm.get("Secure Boot (Legacy)") {
                    secure_boot = Some(sb2.clone());
                }
            }
        }
    }

    // 7) attempt logic board code from system_profiler Model Number or Board Revision
    let mut logic_board_code: Option<String> = None;
    if let Some(ref spm) = sp_map {
        logic_board_code = spm
            .get("Model Number")
            .cloned()
            .or_else(|| spm.get("Board Revision").cloned())
            .or_else(|| spm.get("Logic Board").cloned());
    }

    // 8) chip_type fallback: if chip_type empty and SP has "Chip"
    if chip_type.is_none() {
        if let Some(ref spm) = sp_map {
            chip_type = spm.get("Chip").cloned();
        }
    }

    // 9) assemble debug_raw map（仅在启用 LOGICBOARD_DEBUG 时返回）
    let include_debug = std::env::var("LOGICBOARD_DEBUG").is_ok();
    let mut debug_map: HashMap<String, String> = HashMap::new();
    if include_debug {
        if let Some(ref spraw) = sp_out {
            debug_map.insert("system_profiler_raw".to_string(), spraw.clone());
        }
        if let Some(ref ioregfull) = ioreg_out {
            debug_map.insert("ioreg_raw".to_string(), ioregfull.clone());
        }
        if let Some(ref ioreg_pe) = ioreg_pe_out {
            debug_map.insert("ioreg_platform_expert".to_string(), ioreg_pe.clone());
        }
        if let Some(nv) = run_cmd_trim("nvram", &["-p"]) {
            debug_map.insert("nvram".to_string(), nv);
        }
        if let Some(hm) = hardware_model.clone() {
            debug_map.insert("hw.model".to_string(), hm);
        }
        if let Some(ma) = machine_arch.clone() {
            debug_map.insert("machine_arch".to_string(), ma);
        }
    }

    // 10) Put some SP parsed keys into system_profiler_raw map for front-end convenience
    let system_profiler_map = sp_map.clone();

    // final assembly into struct
    let res = LogicBoardInfo {
        board_id,
        model_identifier,
        platform_uuid,
        hardware_model,
        machine_arch,
        chip_type,
        serial_number,
        firmware_version,
        secure_boot,
        bridge_chip,
        logic_board_code,
        total_cores,
        sp_extras: if sp_extras.is_empty() {
            None
        } else {
            Some(sp_extras)
        },
        system_profiler_raw: system_profiler_map,
        debug_raw: if debug_map.is_empty() {
            None
        } else {
            Some(debug_map)
        },
    };

    Ok(res)
}

/// Tauri command: async wrapper using spawn_blocking
#[command]
pub async fn get_logicboard_info() -> Result<LogicBoardInfo, String> {
    match tauri::async_runtime::spawn_blocking(move || collect_logicboard_info_blocking()).await {
        Ok(Ok(info)) => Ok(info),
        Ok(Err(e)) => Err(format!("collect_logicboard_info_blocking error: {:?}", e)),
        Err(e) => Err(format!("task join error: {:?}", e)),
    }
}
