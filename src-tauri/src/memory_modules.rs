// src-tauri/src/memory_modules.rs
//! Final patched memory modules detection for macOS
//! - extract_memory_block 修复：收集 header + 随后所有缩进行（包含空行后缩进）
//! - 如果 mem_block 包含 Memory/Type/Manufacturer 等关键字，优先将整个 block 当作 Unified Memory 并 enrich（直接返回）
//! - 否则再走槽解析逻辑（支持 BANK/DIMM 等）
use regex::Regex;
use serde::Serialize;
use std::process::Command;
use tauri::command;

#[derive(Serialize, Debug)]
pub struct MemoryModuleInfo {
    pub slot: Option<String>,
    pub size_bytes: Option<u64>,
    pub size_readable: Option<String>,
    pub mem_type: Option<String>,
    pub speed_mhz: Option<u32>,
    pub status: Option<String>,
    pub manufacturer: Option<String>,
    pub part_number: Option<String>,
    pub serial_number: Option<String>,
    pub raw: Option<String>,
}

fn run_cmd_trim(cmd: &str, args: &[&str]) -> Option<String> {
    let out = Command::new(cmd).args(args).output().ok()?;
    if !out.status.success() {
        return None;
    }
    String::from_utf8(out.stdout)
        .ok()
        .map(|s| s.trim().to_string())
}

fn run_cmd_trim_with_lang(cmd: &str, args: &[&str], lang: &str) -> Option<String> {
    let out = Command::new(cmd)
        .args(args)
        .env("LANG", lang)
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    String::from_utf8(out.stdout)
        .ok()
        .map(|s| s.trim().to_string())
}

fn run_sysctl_n(key: &str) -> Option<String> {
    run_cmd_trim("sysctl", &["-n", key])
}

fn parse_number_unit(s: &str) -> Option<(f64, String)> {
    let s = s.trim();
    let re = Regex::new(r"(?i)^\s*([0-9]+(?:\.[0-9]+)?)\s*([kmgtp]?b|[kmgtp]?hz|mhz|[kmgtp])\s*$")
        .ok()?;
    if let Some(cap) = re.captures(s) {
        let num = cap.get(1)?.as_str().parse::<f64>().ok()?;
        let mut unit_raw = cap.get(2)?.as_str().to_uppercase();
        if unit_raw.ends_with('B') && unit_raw.len() > 1 {
            unit_raw = unit_raw[..unit_raw.len() - 1].to_string();
        }
        return Some((num, unit_raw));
    }
    let re2 = Regex::new(r"(?i)^\s*([0-9]+(?:\.[0-9]+)?)([KMGTP])\s*$").ok()?;
    if let Some(cap) = re2.captures(s) {
        let num = cap.get(1)?.as_str().parse::<f64>().ok()?;
        let unit = cap.get(2)?.as_str().to_uppercase();
        return Some((num, unit));
    }
    None
}

fn convert_to_bytes(value: f64, unit: &str) -> u64 {
    match unit {
        "K" => (value * 1024.0) as u64,
        "M" => (value * 1024.0 * 1024.0) as u64,
        "G" => (value * 1024.0 * 1024.0 * 1024.0) as u64,
        "T" => (value * 1024.0_f64.powi(4)) as u64,
        "P" => (value * 1024.0_f64.powi(5)) as u64,
        _ => value as u64,
    }
}

fn parse_speed_mhz(s: &str) -> Option<u32> {
    let s = s.trim();
    let re_ghz = Regex::new(r"(?i)^\s*([0-9]+(?:\.[0-9]+)?)\s*GHZ\s*$").ok()?;
    if let Some(cap) = re_ghz.captures(s) {
        let num = cap.get(1)?.as_str().parse::<f64>().ok()?;
        return Some((num * 1000.0) as u32);
    }
    let re_mhz = Regex::new(r"(?i)^\s*([0-9]+(?:\.[0-9]+)?)\s*MHZ\s*$").ok()?;
    if let Some(cap) = re_mhz.captures(s) {
        let num = cap.get(1)?.as_str().parse::<f64>().ok()?;
        return Some(num as u32);
    }
    if let Some((num, unit)) = parse_number_unit(s) {
        if unit == "M" || unit == "MHZ" {
            return Some(num as u32);
        }
        if unit == "G" {
            return Some((num * 1000.0) as u32);
        }
    }
    None
}

/// 提取 Memory block：header 行 + 后续所有属于该块的缩进行（允许空行后再出现缩进行）
fn extract_memory_block(txt: &str) -> Option<String> {
    // 匹配 Memory / 内存 header 或 inline Memory: 24 GB
    let re_header = Regex::new(r"(?im)^\s*(memory|内存)\s*[:：]?\s*$").ok()?;
    let re_inline = Regex::new(r"(?im)^\s*(memory|内存)\s*[:：]\s*.+$").ok()?;

    let lines: Vec<&str> = txt.lines().collect();
    for (i, &ln) in lines.iter().enumerate() {
        if re_header.is_match(ln) {
            // 从 header 开始，收集后续行，直到遇到下一个 "top-level" (no indent, 有冒号的 section header)
            let mut block = String::new();
            block.push_str(ln);
            let mut j = i + 1;
            // 一次性收集：允许空行，也允许在空行之后出现缩进行
            while j < lines.len() {
                let nxt = lines[j];
                let trimmed = nxt.trim_end();
                if trimmed.is_empty() {
                    // 包含空行，然后继续扫描（不要在空行时立即停止）
                    block.push('\n');
                    block.push_str(nxt);
                    j += 1;
                    continue;
                }
                // 如果下一行有缩进，属于 block
                if nxt.starts_with(' ') || nxt.starts_with('\t') {
                    block.push('\n');
                    block.push_str(nxt);
                    j += 1;
                    continue;
                }
                // 如果下一行是另一个 header（top-level section）则停止
                // 判定：无缩进且包含冒号或全大写词（比如 "Hardware:"）
                let nxt_trim = nxt.trim();
                if nxt_trim.contains(':') && !nxt.starts_with(' ') {
                    break;
                }
                // 其它非缩进行，认为不属于 block -> 停
                break;
            }
            return Some(block);
        }
    }

    // fallback: inline "Memory: 24 GB" style then collect following indented lines
    for (i, &ln) in lines.iter().enumerate() {
        if re_inline.is_match(ln) {
            let mut block = String::new();
            block.push_str(ln);
            let mut j = i + 1;
            while j < lines.len() {
                let nxt = lines[j];
                if nxt.starts_with(' ') || nxt.starts_with('\t') {
                    block.push('\n');
                    block.push_str(nxt);
                    j += 1;
                } else {
                    break;
                }
            }
            return Some(block);
        }
    }

    None
}

/// 从 raw 中抽字段
fn enrich_module_from_raw(info: &mut MemoryModuleInfo) {
    if info.raw.is_none() {
        return;
    }
    let raw = info.raw.as_ref().unwrap();

    let re_kv = Regex::new(r"(?im)^\s*([A-Za-z0-9 _/()\-\u4e00-\u9fff]+?)\s*[:：]\s*(.+)\s*$").ok();

    if let Some(re) = re_kv {
        for cap in re.captures_iter(raw) {
            let key = cap
                .get(1)
                .map(|m| m.as_str().trim().to_lowercase())
                .unwrap_or_default();
            let val = cap
                .get(2)
                .map(|m| m.as_str().trim().to_string())
                .unwrap_or_default();
            match key.as_str() {
                "type" | "memory type" | "module type" | "类型" => {
                    if info.mem_type.is_none() {
                        info.mem_type = Some(val.clone());
                    }
                }
                "manufacturer" | "制造商" | "bank manufacturer" => {
                    if info.manufacturer.is_none() {
                        info.manufacturer = Some(val.clone());
                    }
                }
                "speed" | "clock speed" | "memory speed" | "速度" => {
                    if info.speed_mhz.is_none() {
                        if let Some(mhz) = parse_speed_mhz(&val) {
                            info.speed_mhz = Some(mhz);
                        } else if let Some((n, unit)) = parse_number_unit(&val) {
                            if unit == "G" {
                                info.speed_mhz = Some((n * 1000.0) as u32);
                            } else if unit == "M" {
                                info.speed_mhz = Some(n as u32);
                            }
                        }
                    }
                }
                "part number" | "part" | "部件号" => {
                    if info.part_number.is_none() {
                        info.part_number = Some(val.clone());
                    }
                }
                "serial number" | "serial" | "序列号" => {
                    if info.serial_number.is_none() {
                        info.serial_number = Some(val.clone());
                    }
                }
                "status" | "状态" => {
                    if info.status.is_none() {
                        info.status = Some(val.clone());
                    }
                }
                "memory" | "内存" => {
                    if info.size_readable.is_none() {
                        if let Some((n, u)) = parse_number_unit(&val) {
                            info.size_readable = Some(val.clone());
                            info.size_bytes = Some(convert_to_bytes(n, &u));
                        }
                    }
                }
                _ => {}
            }
        }
    }

    // extra heuristics
    if info.mem_type.is_none() {
        if let Ok(re) = Regex::new(r"(?i)type[:：]\s*([A-Za-z0-9\-]+)") {
            if let Some(cap) = re.captures(raw) {
                info.mem_type = Some(cap[1].to_string());
            }
        }
    }
    if info.manufacturer.is_none() {
        if let Ok(re) = Regex::new(r"(?i)manufacturer[:：]\s*([A-Za-z0-9\-\s]+)") {
            if let Some(cap) = re.captures(raw) {
                info.manufacturer = Some(cap[1].trim().to_string());
            }
        }
    }

    if info.slot.is_none() && raw.to_lowercase().contains("memory") {
        info.slot = Some("Unified Memory".to_string());
    }
}

fn parse_memory_block(block: &str) -> MemoryModuleInfo {
    let mut info = MemoryModuleInfo {
        slot: None,
        size_bytes: None,
        size_readable: None,
        mem_type: None,
        speed_mhz: None,
        status: None,
        manufacturer: None,
        part_number: None,
        serial_number: None,
        raw: Some(block.to_string()),
    };
    if let Some(first_line) = block.lines().next() {
        let fl = first_line.trim().trim_end_matches(':');
        if fl.to_uppercase().contains("BANK")
            || fl.to_uppercase().contains("DIMM")
            || fl.to_lowercase().contains("slot")
        {
            info.slot = Some(fl.to_string());
        }
    }
    for line in block.lines() {
        if let Some(pos) = line.find(':') {
            let key = line[..pos].trim();
            let val = line[pos + 1..].trim();
            match key {
                "Size" | "大小" => {
                    info.size_readable = Some(val.to_string());
                    if let Some((n, u)) = parse_number_unit(val) {
                        info.size_bytes = Some(convert_to_bytes(n, &u));
                    }
                }
                "Type" | "类型" => info.mem_type = Some(val.to_string()),
                "Speed" | "速度" => info.speed_mhz = parse_speed_mhz(val),
                "Status" | "状态" => info.status = Some(val.to_string()),
                "Manufacturer" | "制造商" => info.manufacturer = Some(val.to_string()),
                "Part Number" | "部件号" => info.part_number = Some(val.to_string()),
                "Serial Number" | "序列号" => info.serial_number = Some(val.to_string()),
                _ => {
                    let lk = key.to_lowercase();
                    if lk.contains("size") && info.size_readable.is_none() {
                        info.size_readable = Some(val.to_string());
                        if let Some((n, u)) = parse_number_unit(val) {
                            info.size_bytes = Some(convert_to_bytes(n, &u));
                        }
                    }
                    if lk.contains("manufacturer") && info.manufacturer.is_none() {
                        info.manufacturer = Some(val.to_string());
                    }
                }
            }
        }
    }
    info
}

fn parse_system_profiler_memory_v2(txt: &str) -> Vec<MemoryModuleInfo> {
    let mut modules: Vec<MemoryModuleInfo> = Vec::new();
    if txt.trim().is_empty() {
        return modules;
    }

    // 1) 提取 mem_block (header + subsequent indented lines, even if blank lines between)
    let mem_block = extract_memory_block(txt).unwrap_or_else(|| txt.to_string());

    // 2) 优先：如果 mem_block 本身包含关键字段（Memory: <size> / Type / Manufacturer），直接当作 unified module 并 enrich 返回
    let quick_key_re = Regex::new(r"(?i)(?:memory[:：]\s*[0-9]|type[:：]|manufacturer[:：])").ok();
    if let Some(re) = quick_key_re {
        if re.is_match(&mem_block) {
            // try top-level memory parse first
            let re_memory_top =
                Regex::new(r"(?i)(?:memory|内存)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?\s*[KMGTP]B?)")
                    .ok();
            if let Some(rm) = &re_memory_top {
                if let Some(cap) = rm.captures(&mem_block) {
                    let size_s = cap.get(1).unwrap().as_str();
                    let size_bytes =
                        parse_number_unit(size_s).map(|(n, u)| convert_to_bytes(n, &u));
                    let mut single = MemoryModuleInfo {
                        slot: Some("Unified Memory".to_string()),
                        size_bytes,
                        size_readable: Some(size_s.to_string()),
                        mem_type: None,
                        speed_mhz: None,
                        status: None,
                        manufacturer: None,
                        part_number: None,
                        serial_number: None,
                        raw: Some(mem_block.clone()),
                    };
                    enrich_module_from_raw(&mut single);
                    return vec![single];
                }
            }
            // if we didn't find size but found type/manufacturer lines, still create one module and enrich
            let mut single = MemoryModuleInfo {
                slot: Some("Unified Memory".to_string()),
                size_bytes: None,
                size_readable: None,
                mem_type: None,
                speed_mhz: None,
                status: None,
                manufacturer: None,
                part_number: None,
                serial_number: None,
                raw: Some(mem_block.clone()),
            };
            enrich_module_from_raw(&mut single);
            // if nothing useful found, continue to slot parsing; otherwise return
            if single.size_bytes.is_some()
                || single.mem_type.is_some()
                || single.manufacturer.is_some()
            {
                return vec![single];
            }
        }
    }

    // 3) 否则尝试以槽为单位解析（支持 BANK/DIMM/Slot）
    let lower_block = mem_block.to_lowercase();
    let parse_area = if let Some(pos) = lower_block.find("memory slots") {
        mem_block[pos..].to_string()
    } else if let Some(pos) = lower_block.find("内存插槽") {
        mem_block[pos..].to_string()
    } else {
        mem_block.clone()
    };

    let lines: Vec<&str> = parse_area.lines().collect();
    let mut idx = 0;
    while idx < lines.len() {
        let line = lines[idx].trim_end();
        let u = line.to_uppercase();
        let is_header = (u.starts_with("BANK ")
            || u.contains("DIMM")
            || line.to_lowercase().contains("slot")
            || line.ends_with(':'))
            && line.len() < 200;
        if is_header {
            let mut block = String::new();
            block.push_str(line);
            idx += 1;
            while idx < lines.len() {
                let nxt = lines[idx];
                let nxt_trim = nxt.trim();
                if nxt_trim.is_empty() {
                    idx += 1;
                    continue;
                } // allow blank lines inside block
                let nxt_up = nxt_trim.to_uppercase();
                let nxt_is_header = nxt_up.starts_with("BANK ")
                    || nxt_up.contains("DIMM")
                    || nxt_up.contains("SLOT")
                    || nxt_trim.ends_with(':');
                if nxt_is_header && !nxt.starts_with(' ') {
                    break;
                }
                block.push('\n');
                block.push_str(nxt);
                idx += 1;
            }
            let mut info = parse_memory_block(&block);
            enrich_module_from_raw(&mut info);
            if info.size_bytes.is_some() || info.slot.is_some() {
                modules.push(info);
            }
            continue;
        }
        idx += 1;
    }

    if !modules.is_empty() {
        for m in modules.iter_mut() {
            enrich_module_from_raw(m);
        }
        return modules;
    }

    // 4) 最后尝试 top-level Memory pattern
    let re_memory_top =
        Regex::new(r"(?i)(?:memory|内存)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?\s*[KMGTP]B?)").ok();
    if let Some(ref re) = re_memory_top {
        if let Some(cap) = re.captures(&mem_block) {
            let size_s = cap.get(1).unwrap().as_str();
            let size_bytes = parse_number_unit(size_s).map(|(n, u)| convert_to_bytes(n, &u));
            let mut single = MemoryModuleInfo {
                slot: Some("Unified Memory".to_string()),
                size_bytes,
                size_readable: Some(size_s.to_string()),
                mem_type: None,
                speed_mhz: None,
                status: None,
                manufacturer: None,
                part_number: None,
                serial_number: None,
                raw: Some(mem_block.clone()),
            };
            enrich_module_from_raw(&mut single);
            return vec![single];
        }
    }

    Vec::new()
}

fn collect_memory_modules_blocking() -> Result<Vec<MemoryModuleInfo>, String> {
    // try english mini
    let sp_en_mini = run_cmd_trim_with_lang(
        "system_profiler",
        &["-detailLevel", "mini", "SPMemoryDataType"],
        "en_US.UTF-8",
    );
    if let Some(ref txt) = sp_en_mini {
        let modules = parse_system_profiler_memory_v2(txt);
        if !modules.is_empty() {
            return Ok(modules);
        }
    }

    // try english full
    let sp_en_full = run_cmd_trim_with_lang(
        "system_profiler",
        &["-detailLevel", "full", "SPMemoryDataType"],
        "en_US.UTF-8",
    );
    if let Some(ref txt) = sp_en_full {
        let modules = parse_system_profiler_memory_v2(txt);
        if !modules.is_empty() {
            return Ok(modules);
        }
    }

    // hardware (may include memory lines)
    let sp_hw_en = run_cmd_trim_with_lang(
        "system_profiler",
        &["-detailLevel", "full", "SPHardwareDataType"],
        "en_US.UTF-8",
    );
    if let Some(ref hw_txt) = sp_hw_en {
        let modules = parse_system_profiler_memory_v2(hw_txt);
        if !modules.is_empty() {
            return Ok(modules);
        }
    }

    // local mini/full
    let sp_local_mini = run_cmd_trim(
        "system_profiler",
        &["-detailLevel", "mini", "SPMemoryDataType"],
    );
    if let Some(ref txt) = sp_local_mini {
        let modules = parse_system_profiler_memory_v2(txt);
        if !modules.is_empty() {
            return Ok(modules);
        }
    }
    let sp_local_full = run_cmd_trim(
        "system_profiler",
        &["-detailLevel", "full", "SPMemoryDataType"],
    );
    if let Some(ref txt) = sp_local_full {
        let modules = parse_system_profiler_memory_v2(txt);
        if !modules.is_empty() {
            return Ok(modules);
        }
    }

    // fallback hw.memsize (enrich with any available raw)
    if let Some(memsize) = run_sysctl_n("hw.memsize") {
        if let Ok(n) = memsize.parse::<u64>() {
            let human = if n >= 1 << 30 {
                format!("{} GB", n >> 30)
            } else if n >= 1 << 20 {
                format!("{} MB", n >> 20)
            } else {
                format!("{} B", n)
            };
            let raw_choice = sp_en_full
                .or(sp_hw_en)
                .or(sp_en_mini)
                .or(sp_local_full)
                .or(sp_local_mini);
            let mut single = MemoryModuleInfo {
                slot: Some("Unified Memory".to_string()),
                size_bytes: Some(n),
                size_readable: Some(human),
                mem_type: None,
                speed_mhz: None,
                status: None,
                manufacturer: None,
                part_number: None,
                serial_number: None,
                raw: raw_choice.clone(),
            };
            if single.raw.is_none() {
                single.raw = Some(format!("hw.memsize = {}", n));
            }
            enrich_module_from_raw(&mut single);
            return Ok(vec![single]);
        }
    }

    // final fallback: ioreg hints
    if let Some(ioreg_txt) = run_cmd_trim("ioreg", &["-l"]) {
        let mut mods = Vec::new();
        for line in ioreg_txt.lines() {
            let l = line.trim();
            if l.is_empty() {
                continue;
            }
            let low = l.to_lowercase();
            if low.contains("dimm")
                || low.contains("bank")
                || low.contains("memory")
                || low.contains("内存")
            {
                let mut m = MemoryModuleInfo {
                    slot: None,
                    size_bytes: None,
                    size_readable: None,
                    mem_type: None,
                    speed_mhz: None,
                    status: None,
                    manufacturer: None,
                    part_number: None,
                    serial_number: None,
                    raw: Some(l.to_string()),
                };
                enrich_module_from_raw(&mut m);
                mods.push(m);
            }
        }
        if !mods.is_empty() {
            return Ok(mods);
        }
    }

    Ok(Vec::new())
}

#[command]
pub async fn get_memory_modules() -> Result<Vec<MemoryModuleInfo>, String> {
    match tauri::async_runtime::spawn_blocking(move || collect_memory_modules_blocking()).await {
        Ok(Ok(v)) => Ok(v),
        Ok(Err(e)) => Err(format!("collect_memory_modules_blocking error: {:?}", e)),
        Err(e) => Err(format!("task join error: {:?}", e)),
    }
}
