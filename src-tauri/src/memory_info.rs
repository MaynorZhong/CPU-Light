// src-tauri/src/memory_info.rs
//! macOS 内存 & 虚拟内存采集（blocking helper + tauri command）
//! 返回 MemoryInfo（单位：字节），字段尽量全面且容错。
//!
//! 依赖：regex, serde

use regex::Regex;
use serde::Serialize;
use std::collections::HashMap;
use std::process::Command;
use tauri::command;

/// 内存信息结构（序列化到前端）
#[derive(Serialize, Debug)]
pub struct MemoryInfo {
    // 基本
    pub total_physical_bytes: Option<u64>, // hw.memsize
    pub pagesize_bytes: Option<u64>,       // hw.pagesize

    // vm_stat derived
    pub pages_free_bytes: Option<u64>,
    pub pages_active_bytes: Option<u64>,
    pub pages_inactive_bytes: Option<u64>,
    pub pages_speculative_bytes: Option<u64>,
    pub pages_wired_bytes: Option<u64>, // 从 vm_stat 或 top 尝试解析
    pub pages_purgeable_bytes: Option<u64>,

    // top / physmem derived
    pub used_bytes: Option<u64>,
    pub free_bytes: Option<u64>,
    pub wired_bytes: Option<u64>,
    pub compressor_bytes: Option<u64>,
    pub mem_used_percent: Option<f64>,

    // swap / virtual memory
    pub swap_total_bytes: Option<u64>,
    pub swap_used_bytes: Option<u64>,
    pub swap_free_bytes: Option<u64>,
    pub swap_used_percent: Option<f64>,

    // paging IO counters (if available)
    pub pageins: Option<u64>,
    pub pageouts: Option<u64>,

    // 原始文本用于 debug
    pub vm_stat_raw: Option<String>,
    pub top_physmem_line: Option<String>,
    pub swapusage_raw: Option<String>,

    // 其它 sysctl 原始 map（可选）
    pub sysctl_map: Option<HashMap<String, String>>,
}

/// 运行命令并返回 stdout trim 后字符串
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

/// 解析 vm_stat 的 pages（返回 pages counts: free, active, inactive, speculative, wired, purgeable; raw map）
fn parse_vm_stat(txt: &str) -> (HashMap<String, u64>, String) {
    let mut m: HashMap<String, u64> = HashMap::new();
    // Example lines:
    // Pages free:                               35647.
    // Pages active:                           1582138.
    // Pages inactive:                         2343567.
    // Pages speculative:                        49210.
    // Pages wired down:                        472001.
    // Pages purgeable:                         178743.
    // Pageins: 12345
    // Pageouts: 6789
    for line in txt.lines() {
        let s = line.trim();
        if s.is_empty() {
            continue;
        }
        // match "Pages <name>: <num>."
        if let Some(cap) = Regex::new(r"^Pages?\s+([a-zA-Z0-9_ ]+):\s*([0-9]+)\.?$")
            .unwrap()
            .captures(s)
        {
            let key = cap[1].trim().to_lowercase().replace(' ', "_");
            if let Ok(v) = cap[2].parse::<u64>() {
                m.insert(key, v);
            }
            continue;
        }
        // match Pageins / Pageouts
        if let Some(cap) = Regex::new(r"^Pageins:\s*([0-9]+)").unwrap().captures(s) {
            if let Ok(v) = cap[1].parse::<u64>() {
                m.insert("pageins".to_string(), v);
            }
            continue;
        }
        if let Some(cap) = Regex::new(r"^Pageouts:\s*([0-9]+)").unwrap().captures(s) {
            if let Ok(v) = cap[1].parse::<u64>() {
                m.insert("pageouts".to_string(), v);
            }
            continue;
        }
        // some vm_stat prints "Pages wired down:" or "Pages wired:" - we handle both via first regex
    }
    (m, txt.to_string())
}

/// 解析 top 输出的 PhysMem 行（尝试提取 used, wired, compressor, unused）
fn parse_top_physmem(txt: &str) -> Option<(String, HashMap<String, u64>)> {
    // find line starting with "PhysMem:" (case sensitive)
    if let Some(pos) = txt.find("PhysMem:") {
        if let Some(line) = txt[pos..].lines().next() {
            // return raw line and parsed numbers
            // Example: PhysMem: 23G used (2469M wired, 6757M compressor), 122M unused.
            let mut map = HashMap::new();
            // regex to find numbers with units: e.g. 23G, 2469M
            let re_kv = Regex::new(r"([0-9]+(?:\.[0-9]+)?)([KMGTP])\s*([a-zA-Z]+)?").unwrap();
            // helper to convert (num,unit) -> bytes
            let conv = |num: &str, unit: &str| -> u64 {
                let f = num.parse::<f64>().unwrap_or(0.0);
                match unit {
                    "K" => (f * 1024.0) as u64,
                    "M" => (f * 1024.0 * 1024.0) as u64,
                    "G" => (f * 1024.0 * 1024.0 * 1024.0) as u64,
                    "T" => (f * 1024.0 * 1024.0 * 1024.0 * 1024.0) as u64,
                    "P" => (f * 1024.0_f64.powi(5)) as u64,
                    _ => num.parse::<u64>().unwrap_or(0u64),
                }
            };
            // find wired
            let re_wired = Regex::new(r"([0-9]+(?:\.[0-9]+)?[KMGTP])\s*wired").unwrap();
            if let Some(cap) = re_wired.captures(line) {
                // cap[1] like "2469M"
                let token = &cap[1];
                let parts = Regex::new(r"([0-9]+(?:\.[0-9]+)?)([KMGTP])")
                    .unwrap()
                    .captures(token)
                    .unwrap();
                map.insert(
                    "wired".to_string(),
                    conv(
                        parts.get(1).unwrap().as_str(),
                        parts.get(2).unwrap().as_str(),
                    ),
                );
            }
            // compressor
            let re_comp = Regex::new(r"([0-9]+(?:\.[0-9]+)?[KMGTP])\s*compressor").unwrap();
            if let Some(cap) = re_comp.captures(line) {
                let token = &cap[1];
                let parts = Regex::new(r"([0-9]+(?:\.[0-9]+)?)([KMGTP])")
                    .unwrap()
                    .captures(token)
                    .unwrap();
                map.insert(
                    "compressor".to_string(),
                    conv(
                        parts.get(1).unwrap().as_str(),
                        parts.get(2).unwrap().as_str(),
                    ),
                );
            }
            // used overall: "23G used"
            let re_used = Regex::new(r"([0-9]+(?:\.[0-9]+)?)([KMGTP])\s*used").unwrap();
            if let Some(cap) = re_used.captures(line) {
                map.insert(
                    "used".to_string(),
                    conv(cap.get(1).unwrap().as_str(), cap.get(2).unwrap().as_str()),
                );
            }
            // unused: "122M unused"
            let re_unused = Regex::new(r"([0-9]+(?:\.[0-9]+)?)([KMGTP])\s*unused").unwrap();
            if let Some(cap) = re_unused.captures(line) {
                map.insert(
                    "unused".to_string(),
                    conv(cap.get(1).unwrap().as_str(), cap.get(2).unwrap().as_str()),
                );
            }
            return Some((line.to_string(), map));
        }
    }
    None
}

/// 解析 vm.swapusage 输出（例如: "vm.swapusage: total = 4096.00M  used = 0.00M  free = 4096.00M  (encrypted)"）
fn parse_swapusage(txt: &str) -> (Option<u64>, Option<u64>, Option<String>) {
    let re = Regex::new(r"total\s*=\s*([0-9.]+)([KMGTP])\s*used\s*=\s*([0-9.]+)([KMGTP])").unwrap();
    if let Some(cap) = re.captures(txt) {
        let to_bytes = |num: &str, unit: &str| -> u64 {
            let f = num.parse::<f64>().unwrap_or(0.0);
            match unit {
                "K" => (f * 1024.0) as u64,
                "M" => (f * 1024.0 * 1024.0) as u64,
                "G" => (f * 1024.0 * 1024.0 * 1024.0) as u64,
                "T" => (f * 1024.0 * 1024.0 * 1024.0 * 1024.0) as u64,
                "P" => (f * 1024.0_f64.powi(5)) as u64,
                _ => 0,
            }
        };
        let total = to_bytes(cap.get(1).unwrap().as_str(), cap.get(2).unwrap().as_str());
        let used = to_bytes(cap.get(3).unwrap().as_str(), cap.get(4).unwrap().as_str());
        return (Some(total), Some(used), Some(txt.to_string()));
    }
    // fallback: try a simpler pattern with numbers
    (None, None, Some(txt.to_string()))
}

/// 主采集函数（阻塞）
fn collect_memory_info_blocking() -> Result<MemoryInfo, String> {
    // sysctl hw.memsize
    let total_physical_bytes = run_sysctl_n("hw.memsize").and_then(|s| s.parse::<u64>().ok());

    // pagesize
    let pagesize_bytes = run_sysctl_n("hw.pagesize").and_then(|s| s.parse::<u64>().ok());

    // vm_stat
    let vm_stat_out = run_cmd_trim("vm_stat", &[]); // no args
    let (vm_map, vm_raw) = if let Some(ref txt) = vm_stat_out {
        let (map, raw) = parse_vm_stat(txt);
        (map, Some(raw))
    } else {
        (HashMap::new(), None)
    };

    // convert page counts -> bytes (if pagesize known)
    let get_pages_bytes = |key: &str| -> Option<u64> {
        pagesize_bytes.and_then(|ps| vm_map.get(key).map(|p| p * ps))
    };

    let pages_free_bytes = get_pages_bytes("free").or_else(|| get_pages_bytes("pages_free"));
    let pages_active_bytes = get_pages_bytes("active").or_else(|| get_pages_bytes("pages_active"));
    let pages_inactive_bytes =
        get_pages_bytes("inactive").or_else(|| get_pages_bytes("pages_inactive"));
    let pages_speculative_bytes = get_pages_bytes("speculative");
    let pages_wired_bytes = get_pages_bytes("wired_down").or_else(|| get_pages_bytes("wired"));
    let pages_purgeable_bytes = get_pages_bytes("purgeable");

    // top physmem parse (to get compressor/wired/used/unused)
    // call top once
    let top_out = run_cmd_trim("top", &["-l", "1", "-n", "0", "-stats", "mem,cpu"]);
    let mut top_physmem_line: Option<String> = None;
    let mut top_map: HashMap<String, u64> = HashMap::new();
    if let Some(ref txt) = top_out {
        if let Some((line, m)) = parse_top_physmem(txt) {
            top_physmem_line = Some(line);
            top_map = m;
        }
    }

    // fill wired/compressor/used/free from either vm_stat or top
    let wired_bytes = pages_wired_bytes.or_else(|| top_map.get("wired").cloned());
    let compressor_bytes = top_map.get("compressor").cloned();
    let used_bytes = top_map.get("used").cloned();
    let free_bytes = pages_free_bytes.or_else(|| top_map.get("unused").cloned());

    // compute mem_used_percent if we know total and used
    let mem_used_percent = match (total_physical_bytes, used_bytes) {
        (Some(total), Some(used)) if total > 0 => Some((used as f64 / total as f64) * 100.0),
        _ => None,
    };

    // vm.swapusage via sysctl (or sysctl -n vm.swapusage)
    let mut swap_total_bytes: Option<u64> = None;
    let mut swap_used_bytes: Option<u64> = None;
    let mut swap_usage_raw: Option<String> = None;
    if let Some(swap_txt) = run_sysctl_n("vm.swapusage") {
        // sysctl prints: "vm.swapusage: total = 4096.00M  used = 0.00M  free = 4096.00M  (encrypted)"
        let (maybe_total, maybe_used, raw) = parse_swapusage(&swap_txt);
        swap_total_bytes = maybe_total;
        swap_used_bytes = maybe_used;
        swap_usage_raw = raw;
    } else {
        // fallback: try "sysctl vm.swapusage" (without -n)
        if let Some(swap_txt) = run_cmd_trim("sysctl", &["vm.swapusage"]) {
            let (maybe_total, maybe_used, raw) = parse_swapusage(&swap_txt);
            swap_total_bytes = maybe_total;
            swap_used_bytes = maybe_used;
            swap_usage_raw = raw;
        }
    }

    let swap_free_bytes =
        swap_total_bytes.and_then(|t| swap_used_bytes.map(|u| t.saturating_sub(u)));
    let swap_used_percent = match (swap_total_bytes, swap_used_bytes) {
        (Some(t), Some(u)) if t > 0 => Some((u as f64 / t as f64) * 100.0),
        _ => None,
    };

    // pageins/pageouts from vm_map
    let pageins = vm_map
        .get("pageins")
        .cloned()
        .or_else(|| vm_map.get("pages_in").cloned());
    let pageouts = vm_map
        .get("pageouts")
        .cloned()
        .or_else(|| vm_map.get("pages_out").cloned());

    // build sysctl map quick sample for debugging (hw.memsize, hw.pagesize)
    let mut sysctl_map: HashMap<String, String> = HashMap::new();
    if let Some(ref s) = total_physical_bytes {
        sysctl_map.insert("hw.memsize".to_string(), s.to_string());
    }
    if let Some(ref s) = pagesize_bytes {
        sysctl_map.insert("hw.pagesize".to_string(), s.to_string());
    }

    Ok(MemoryInfo {
        total_physical_bytes,
        pagesize_bytes,
        pages_free_bytes,
        pages_active_bytes,
        pages_inactive_bytes,
        pages_speculative_bytes,
        pages_wired_bytes,
        pages_purgeable_bytes,
        used_bytes,
        free_bytes,
        wired_bytes,
        compressor_bytes,
        mem_used_percent,
        swap_total_bytes,
        swap_used_bytes,
        swap_free_bytes,
        swap_used_percent,
        pageins,
        pageouts,
        vm_stat_raw: vm_raw,
        top_physmem_line,
        swapusage_raw: swap_usage_raw,
        sysctl_map: Some(sysctl_map),
    })
}

/// Tauri command wrapper (async)
#[command]
pub async fn get_memory_info() -> Result<MemoryInfo, String> {
    match tauri::async_runtime::spawn_blocking(move || collect_memory_info_blocking()).await {
        Ok(Ok(info)) => Ok(info),
        Ok(Err(e)) => Err(format!("collect_memory_info_blocking error: {:?}", e)),
        Err(e) => Err(format!("task join error: {:?}", e)),
    }
}
