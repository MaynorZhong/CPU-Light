// src-tauri/src/gpu_info.rs
//! GPU / Displays info collector for macOS (fixed ownership issues)
//! - 使用 system_profiler SPDisplaysDataType（优先英文环境）
//! - 解析 GPU adapter（Chipset Model / Vendor / VRAM / Metal / Total Number of Cores / Bus）
//! - 解析 Displays 部分（识别 Displays: 下缩进的每个显示块）
//! - 避免不必要的 String moves：尽量用 &str，在保存到结构体时再 clone
use regex::Regex;
use serde::Serialize;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::command;

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GPUAdapter {
    pub model: Option<String>,
    pub vendor: Option<String>,
    pub vram_bytes: Option<u64>,
    pub vram_readable: Option<String>,
    pub metal_family: Option<String>,
    pub metal_supported: Option<bool>,
    pub total_cores: Option<u32>,
    pub device_id: Option<String>,
    pub bus: Option<String>,
    pub raw: Option<String>,
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DisplayInfo {
    pub name: Option<String>,
    pub resolution: Option<String>,
    pub ui_looks_like: Option<String>,
    pub pixel_width: Option<u32>,
    pub pixel_height: Option<u32>,
    pub depth: Option<String>,
    pub connection_type: Option<String>,
    pub is_builtin: Option<bool>,
    pub is_main: Option<bool>,
    pub raw: Option<String>,
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GPUInfo {
    pub adapters: Vec<GPUAdapter>,
    pub displays: Vec<DisplayInfo>,
    pub system_profiler_raw: Option<String>,
    pub ioreg_raw: Option<String>,
    pub timestamp_unix: u64,
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

/// Parse things like "16 GB" / "1536 MB" -> bytes
fn parse_size_to_bytes(s: &str) -> Option<u64> {
    let s = s.trim();
    let re = Regex::new(r"(?i)^\s*([0-9]+(?:\.[0-9]+)?)\s*([kmgtp]?)(?:b)?\s*$").unwrap();
    let cap = re.captures(s)?;
    let n = cap.get(1)?.as_str().parse::<f64>().ok()?;
    let unit = cap
        .get(2)
        .map(|m| m.as_str().to_uppercase())
        .unwrap_or_default();
    let bytes = match unit.as_str() {
        "K" => (n * 1024.0) as u64,
        "M" => (n * 1024.0 * 1024.0) as u64,
        "G" => (n * 1024.0 * 1024.0 * 1024.0) as u64,
        "T" => (n * 1024.0_f64.powi(4)) as u64,
        "" => n as u64,
        _ => n as u64,
    };
    Some(bytes)
}

fn leading_spaces(s: &str) -> usize {
    s.chars().take_while(|c| *c == ' ' || *c == '\t').count()
}

/// Parse a GPU adapter block text (key: value lines)
fn parse_adapter_block(block: &str) -> GPUAdapter {
    let mut a = GPUAdapter {
        model: None,
        vendor: None,
        vram_bytes: None,
        vram_readable: None,
        metal_family: None,
        metal_supported: None,
        total_cores: None,
        device_id: None,
        bus: None,
        raw: Some(block.to_string()),
    };

    let re_digits = Regex::new(r"^([0-9]+)").unwrap();

    for line in block.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if let Some(pos) = trimmed.find(':') {
            let key = trimmed[..pos].trim().to_lowercase();
            let val_str = trimmed[pos + 1..].trim();
            match key.as_str() {
                "chipset model" | "chipset" | "graphics/processor" | "gpu" => {
                    if a.model.is_none() {
                        a.model = Some(val_str.to_string());
                    }
                }
                "vendor" | "vendor id" => {
                    if a.vendor.is_none() {
                        a.vendor = Some(val_str.to_string());
                    }
                }
                "vram" | "vram (total)" | "vram (dynamic, max)" => {
                    if a.vram_readable.is_none() {
                        a.vram_readable = Some(val_str.to_string());
                    }
                    if a.vram_bytes.is_none() {
                        if let Some(b) = parse_size_to_bytes(val_str) {
                            a.vram_bytes = Some(b);
                        }
                    }
                }
                "metal support" | "metal:" | "metal support:" => {
                    if a.metal_family.is_none() {
                        a.metal_family = Some(val_str.to_string());
                    }
                    if a.metal_supported.is_none() {
                        let low = val_str.to_lowercase();
                        if low.contains("metal") || low.contains("supported") {
                            a.metal_supported = Some(true);
                        }
                    }
                }
                "metal family" => {
                    if a.metal_family.is_none() {
                        a.metal_family = Some(val_str.to_string());
                    }
                }
                "total number of cores" => {
                    if a.total_cores.is_none() {
                        if let Some(cap) = re_digits.captures(val_str) {
                            if let Ok(n) = cap.get(1).unwrap().as_str().parse::<u32>() {
                                a.total_cores = Some(n);
                            }
                        }
                    }
                }
                "device id" => {
                    if a.device_id.is_none() {
                        a.device_id = Some(val_str.to_string());
                    }
                }
                "bus" | "bus:" => {
                    if a.bus.is_none() {
                        a.bus = Some(val_str.to_string());
                    }
                }
                _ => {
                    if key.contains("chipset") && a.model.is_none() {
                        a.model = Some(val_str.to_string());
                    }
                    if key.contains("vendor") && a.vendor.is_none() {
                        a.vendor = Some(val_str.to_string());
                    }
                }
            }
        } else {
            // inline words: e.g., "Metal: Supported"
            let low = trimmed.to_lowercase();
            if a.metal_supported.is_none() && low.starts_with("metal") {
                if low.contains("supported") {
                    a.metal_supported = Some(true);
                } else if low.contains("unsupported") {
                    a.metal_supported = Some(false);
                }
            }
        }
    }

    a
}

/// Parse adapters from system_profiler text (single implementation)
fn parse_adapters_from_text(txt: &str) -> Vec<GPUAdapter> {
    let mut adapters = Vec::new();
    if txt.trim().is_empty() {
        return adapters;
    }

    let lines: Vec<&str> = txt.lines().collect();
    let mut i = 0usize;
    while i < lines.len() {
        let line = lines[i].trim();
        let is_chipset_line = line.to_lowercase().starts_with("chipset model")
            || line.to_lowercase().contains("chipset model:");
        let looks_like_gpu_header = line.ends_with(':')
            && (line.to_lowercase().contains("apple")
                || line.to_lowercase().contains("gpu")
                || line.to_lowercase().contains("graphics"));

        if is_chipset_line || looks_like_gpu_header {
            let mut block = String::new();
            block.push_str(lines[i]);
            i += 1;
            while i < lines.len() {
                let nxt = lines[i];
                if nxt.trim().is_empty() {
                    block.push('\n');
                    block.push_str(nxt);
                    i += 1;
                    continue;
                }
                if nxt.starts_with(' ') || nxt.starts_with('\t') || nxt.contains(':') {
                    block.push('\n');
                    block.push_str(nxt);
                    i += 1;
                    continue;
                }
                break;
            }
            let adapter = parse_adapter_block(&block);
            adapters.push(adapter);
            continue;
        }
        i += 1;
    }

    // fallback: find "Metal" keyword and gather surrounding lines
    if adapters.is_empty() {
        let re = Regex::new(r"(?i)metal").unwrap();
        for (idx, &ln) in lines.iter().enumerate() {
            if re.is_match(ln) {
                let start = idx.saturating_sub(3);
                let end = std::cmp::min(lines.len(), idx + 4);
                let block = lines[start..end].join("\n");
                let adapter = parse_adapter_block(&block);
                adapters.push(adapter);
            }
        }
    }

    adapters
}

/// Parse a single display block (header + indented properties)
fn parse_display_block(block: &str) -> DisplayInfo {
    let mut d = DisplayInfo {
        name: None,
        resolution: None,
        ui_looks_like: None,
        pixel_width: None,
        pixel_height: None,
        depth: None,
        connection_type: None,
        is_builtin: None,
        is_main: None,
        raw: Some(block.to_string()),
    };

    // first non-empty line that ends with ':' is likely the name
    if let Some(first) = block.lines().find(|l| !l.trim().is_empty()) {
        let t = first.trim();
        if t.ends_with(':') {
            d.name = Some(t.trim_end_matches(':').to_string());
        }
    }

    let re_res = Regex::new(r"([0-9]+)\s*x\s*([0-9]+)").unwrap();

    for line in block.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if let Some(pos) = trimmed.find(':') {
            let key = trimmed[..pos].trim().to_lowercase();
            let val_str = trimmed[pos + 1..].trim();
            match key.as_str() {
                "resolution" => {
                    d.resolution = Some(val_str.to_string());
                    if let Some(cap) = re_res.captures(val_str) {
                        if let Ok(w) = cap.get(1).unwrap().as_str().parse::<u32>() {
                            d.pixel_width = Some(w);
                        }
                        if let Ok(h) = cap.get(2).unwrap().as_str().parse::<u32>() {
                            d.pixel_height = Some(h);
                        }
                    }
                }
                "ui looks like" => {
                    d.ui_looks_like = Some(val_str.to_string());
                }
                "display type" => {
                    if d.name.is_none() {
                        d.name = Some(val_str.to_string());
                    }
                    let low = val_str.to_lowercase();
                    if low.contains("built-in") || low.contains("internal") {
                        d.is_builtin = Some(true);
                    }
                }
                "connection type" => {
                    d.connection_type = Some(val_str.to_string());
                    if val_str.to_lowercase().contains("internal") {
                        d.is_builtin = Some(true);
                    }
                }
                "main display" => {
                    let low = val_str.to_lowercase();
                    let is_main = low.starts_with('y') || low == "yes" || low == "true";
                    d.is_main = Some(is_main);
                    if is_main && d.is_builtin.is_none() {
                        d.is_builtin = Some(true);
                    }
                }
                _ => {
                    if key.contains("resolution") && d.resolution.is_none() {
                        d.resolution = Some(val_str.to_string());
                    }
                }
            }
        } else {
            let t = trimmed;
            if t.ends_with(':') && d.name.is_none() {
                d.name = Some(t.trim_end_matches(':').to_string());
            }
        }
    }

    if d.is_builtin.is_none() {
        if let Some(ref name) = d.name {
            let low = name.to_lowercase();
            if low.contains("color lcd") || low.contains("built-in") || low.contains("retina") {
                d.is_builtin = Some(true);
            }
        }
    }

    d
}

/// Parse Displays section robustly: find "Displays:" then treat each indented "Header:" as a display
fn parse_displays_from_text(txt: &str) -> Vec<DisplayInfo> {
    let mut displays: Vec<DisplayInfo> = Vec::new();
    if txt.trim().is_empty() {
        return displays;
    }

    let lines: Vec<&str> = txt.lines().collect();

    // find index of a line that starts with "Displays:" (case-insensitive)
    let mut displays_idx: Option<usize> = None;
    for (i, &ln) in lines.iter().enumerate() {
        if ln.trim().to_lowercase().starts_with("displays:") {
            displays_idx = Some(i);
            break;
        }
    }

    if let Some(start) = displays_idx {
        let base_indent = leading_spaces(lines[start]);
        let mut i = start + 1;
        while i < lines.len() {
            let ln = lines[i];
            let indent = leading_spaces(ln);
            let trimmed = ln.trim();
            if trimmed.is_empty() {
                i += 1;
                continue;
            }

            if indent <= base_indent && trimmed.ends_with(':') {
                break;
            }

            if trimmed.ends_with(':') && indent > base_indent {
                let header_indent = indent;
                let mut block = String::new();
                block.push_str(lines[i]);
                i += 1;
                while i < lines.len() {
                    let nxt = lines[i];
                    let nxt_indent = leading_spaces(nxt);
                    let nxt_trim = nxt.trim();
                    if nxt_trim.is_empty() {
                        block.push('\n');
                        block.push_str(nxt);
                        i += 1;
                        continue;
                    }
                    if nxt_trim.ends_with(':') && nxt_indent == header_indent {
                        break;
                    }
                    if nxt_indent <= base_indent && nxt_trim.ends_with(':') {
                        break;
                    }
                    block.push('\n');
                    block.push_str(nxt);
                    i += 1;
                }
                let d = parse_display_block(&block);
                if d.name.is_some() || d.resolution.is_some() {
                    displays.push(d);
                }
                continue;
            }

            i += 1;
        }
    }

    // fallback: look for any "Resolution:" occurrences
    if displays.is_empty() {
        let re = Regex::new(r"(?i)resolution\s*:\s*([0-9]+\s*x\s*[0-9]+(?:\s*Retina)?)").unwrap();
        for cap in re.captures_iter(txt) {
            let res = cap.get(1).unwrap().as_str().to_string();
            let mut d = DisplayInfo {
                name: None,
                resolution: Some(res.clone()),
                ui_looks_like: None,
                pixel_width: None,
                pixel_height: None,
                depth: None,
                connection_type: None,
                is_builtin: None,
                is_main: None,
                raw: Some(cap.get(0).unwrap().as_str().to_string()),
            };
            if let Some(caps) = Regex::new(r"([0-9]+)\s*x\s*([0-9]+)")
                .unwrap()
                .captures(&res)
            {
                if let Ok(w) = caps.get(1).unwrap().as_str().parse::<u32>() {
                    d.pixel_width = Some(w);
                }
                if let Ok(h) = caps.get(2).unwrap().as_str().parse::<u32>() {
                    d.pixel_height = Some(h);
                }
            }
            displays.push(d);
        }
    }

    displays
}

#[command]
pub async fn get_gpu_info() -> Result<GPUInfo, String> {
    match tauri::async_runtime::spawn_blocking(move || collect_gpu_info_blocking()).await {
        Ok(Ok(info)) => Ok(info),
        Ok(Err(e)) => Err(format!("collect gpu info error: {:?}", e)),
        Err(e) => Err(format!("task join error: {:?}", e)),
    }
}

fn collect_gpu_info_blocking() -> Result<GPUInfo, String> {
    // prefer english full output to reduce localization issues
    let sp_txt = run_cmd_trim_with_lang(
        "system_profiler",
        &["-detailLevel", "full", "SPDisplaysDataType"],
        "en_US.UTF-8",
    )
    .or_else(|| {
        run_cmd_trim(
            "system_profiler",
            &["-detailLevel", "full", "SPDisplaysDataType"],
        )
    });
    let ioreg_txt = run_cmd_trim("ioreg", &["-l"]);

    let mut adapters: Vec<GPUAdapter> = Vec::new();
    let mut displays: Vec<DisplayInfo> = Vec::new();

    if let Some(ref txt) = sp_txt {
        adapters = parse_adapters_from_text(txt);
        displays = parse_displays_from_text(txt);

        for a in adapters.iter_mut() {
            if a.metal_family.is_some() && a.metal_supported.is_none() {
                a.metal_supported = Some(true);
            }
        }
    }

    if adapters.is_empty() {
        if let Some(ref ioreg) = ioreg_txt {
            for ln in ioreg.lines() {
                let l = ln.trim();
                if l.is_empty() {
                    continue;
                }
                let low = l.to_lowercase();
                if low.contains("agx")
                    || low.contains("gpu")
                    || (low.contains("apple") && low.contains("gpu"))
                {
                    adapters.push(GPUAdapter {
                        model: Some(l.to_string()),
                        vendor: None,
                        vram_bytes: None,
                        vram_readable: None,
                        metal_family: None,
                        metal_supported: None,
                        total_cores: None,
                        device_id: None,
                        bus: None,
                        raw: Some(l.to_string()),
                    });
                }
            }
        }
    }

    let timestamp_unix = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    Ok(GPUInfo {
        adapters,
        displays,
        system_profiler_raw: sp_txt,
        ioreg_raw: ioreg_txt,
        timestamp_unix,
    })
}
