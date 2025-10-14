pub mod cache_info {
    use serde::Serialize;
    use std::collections::HashMap;
    use std::process::Command;
    use std::str;
    use tauri::command;

    use crate::utils::utils::run_sysctl_n;

    #[derive(Serialize, Debug)]
    pub struct PerflevelCache {
        pub l1i_bytes: Option<u64>,
        pub l1d_bytes: Option<u64>,
        pub l2_bytes: Option<u64>,
    }

    #[derive(Serialize, Debug)]
    pub struct VmCacheInfo {
        pub page_filecache_min: Option<u64>,
        pub pageout_protected_sharedcache: Option<u64>,
        pub pageout_forcereclaimed_sharedcache: Option<u64>,
        pub apple_protect_pager_cache_limit: Option<u64>,
        // Derived dynamic fields from vm_stat (bytes)
        pub pagesize_bytes: Option<u64>,
        pub pages_active_bytes: Option<u64>,
        pub pages_inactive_bytes: Option<u64>,
        pub pages_free_bytes: Option<u64>,
    }

    #[derive(Serialize, Debug)]
    pub struct CpuCacheInfo {
        // static CPU cache fields
        pub cache_line_bytes: Option<u64>,
        pub cache_l1i_bytes: Option<u64>,
        pub cache_l1d_bytes: Option<u64>,
        pub cache_l2_bytes: Option<u64>,
        pub cache_l3_bytes: Option<u64>,

        // perflevel indexed caches (e.g. perflevel0, perflevel1)
        pub perflevel: Option<HashMap<u32, PerflevelCache>>,

        // raw arrays for advanced debugging
        pub cache_sizes_raw: Option<Vec<u64>>,
        pub cache_config_raw: Option<Vec<i64>>,

        // vm / page-cache related (dynamic / optional)
        pub vm_cache: Option<VmCacheInfo>,

        // debug: store other sysctl key->value pairs that are cache-related but not shown in overview
        pub debug_sysctls: Option<HashMap<String, String>>,
    }

    /// parse a whitespace-separated list of integer tokens into Vec<u64>
    fn parse_u64_list(s: &str) -> Option<Vec<u64>> {
        let mut v = Vec::new();
        for part in s.split_whitespace() {
            // try direct parse
            if let Ok(n) = part.parse::<u64>() {
                v.push(n);
                continue;
            }
            // filter digits (in case of stray chars)
            let filtered: String = part.chars().filter(|c| c.is_ascii_digit()).collect();
            if !filtered.is_empty() {
                if let Ok(n) = filtered.parse::<u64>() {
                    v.push(n);
                }
            }
        }
        if v.is_empty() {
            None
        } else {
            Some(v)
        }
    }

    fn parse_i64_list(s: &str) -> Option<Vec<i64>> {
        let mut v = Vec::new();
        for part in s.split_whitespace() {
            if let Ok(n) = part.parse::<i64>() {
                v.push(n);
                continue;
            }
            let filtered: String = part
                .chars()
                .filter(|c| c.is_ascii_digit() || *c == '-')
                .collect();
            if !filtered.is_empty() {
                if let Ok(n) = filtered.parse::<i64>() {
                    v.push(n);
                }
            }
        }
        if v.is_empty() {
            None
        } else {
            Some(v)
        }
    }

    /// parse vm_stat output to extract "Pages free/active/inactive" (returns page counts)
    fn parse_vm_stat_pages(txt: &str) -> (Option<u64>, Option<u64>, Option<u64>) {
        let mut free_pages: Option<u64> = None;
        let mut active_pages: Option<u64> = None;
        let mut inactive_pages: Option<u64> = None;

        for line in txt.lines() {
            let l = line.trim();
            if l.starts_with("Pages free:") {
                if let Some(tok) = l.split_whitespace().last() {
                    let tok = tok.trim_end_matches('.');
                    if let Ok(n) = tok.parse::<u64>() {
                        free_pages = Some(n);
                    }
                }
            } else if l.starts_with("Pages active:") {
                if let Some(tok) = l.split_whitespace().last() {
                    let tok = tok.trim_end_matches('.');
                    if let Ok(n) = tok.parse::<u64>() {
                        active_pages = Some(n);
                    }
                }
            } else if l.starts_with("Pages inactive:") {
                if let Some(tok) = l.split_whitespace().last() {
                    let tok = tok.trim_end_matches('.');
                    if let Ok(n) = tok.parse::<u64>() {
                        inactive_pages = Some(n);
                    }
                }
            }
        }

        (free_pages, active_pages, inactive_pages)
    }

    /// Collect cache info (blocking). Returns CpuCacheInfo or anyhow::Error
    fn collect_cache_info_blocking() -> Result<CpuCacheInfo, String> {
        // static cache fields
        let cache_line_bytes = run_sysctl_n("hw.cachelinesize").and_then(|s| s.parse::<u64>().ok());
        let cache_l1i = run_sysctl_n("hw.l1icachesize").and_then(|s| s.parse::<u64>().ok());
        let cache_l1d = run_sysctl_n("hw.l1dcachesize").and_then(|s| s.parse::<u64>().ok());
        let cache_l2 = run_sysctl_n("hw.l2cachesize").and_then(|s| s.parse::<u64>().ok());
        let cache_l3 = run_sysctl_n("hw.l3cachesize").and_then(|s| s.parse::<u64>().ok());

        // raw arrays
        let cache_sizes_raw = run_sysctl_n("hw.cachesize").and_then(|s| parse_u64_list(&s));
        let cache_config_raw = run_sysctl_n("hw.cacheconfig").and_then(|s| parse_i64_list(&s));

        // perflevel fields (try 0..=3, collect only those that exist)
        let mut perf_map: HashMap<u32, PerflevelCache> = HashMap::new();
        for i in 0..=6u32 {
            let k_l1i = format!("hw.perflevel{}.l1icachesize", i);
            if let Some(v) = run_sysctl_n(&k_l1i).and_then(|s| s.parse::<u64>().ok()) {
                let l1d = run_sysctl_n(&format!("hw.perflevel{}.l1dcachesize", i))
                    .and_then(|s| s.parse::<u64>().ok());
                let l2 = run_sysctl_n(&format!("hw.perflevel{}.l2cachesize", i))
                    .and_then(|s| s.parse::<u64>().ok());
                perf_map.insert(
                    i,
                    PerflevelCache {
                        l1i_bytes: Some(v),
                        l1d_bytes: l1d,
                        l2_bytes: l2,
                    },
                );
            }
        }
        let perflevel = if perf_map.is_empty() {
            None
        } else {
            Some(perf_map)
        };

        // vm/sysctl dynamic fields (vm.*)
        let vm_page_filecache_min =
            run_sysctl_n("vm.vm_page_filecache_min").and_then(|s| s.parse::<u64>().ok());
        let apple_protect_pager_cache_limit =
            run_sysctl_n("vm.apple_protect_pager_cache_limit").and_then(|s| s.parse::<u64>().ok());
        let pageout_protected_sharedcache =
            run_sysctl_n("vm.pageout_protected_sharedcache").and_then(|s| s.parse::<u64>().ok());
        let pageout_forcereclaimed_sharedcache =
            run_sysctl_n("vm.pageout_forcereclaimed_sharedcache")
                .and_then(|s| s.parse::<u64>().ok());

        // parse vm_stat (get pagesize first)
        let pagesize = run_sysctl_n("hw.pagesize").and_then(|s| s.parse::<u64>().ok());

        // run vm_stat safely (may require slight delay); vm_stat prints lines like "Pages free: 12345."
        let vm_stat_out = Command::new("vm_stat").output().ok();
        let (pages_free, pages_active, pages_inactive) = if let Some(o) = vm_stat_out {
            if o.status.success() {
                if let Ok(txt) = String::from_utf8(o.stdout) {
                    parse_vm_stat_pages(&txt)
                } else {
                    (None, None, None)
                }
            } else {
                (None, None, None)
            }
        } else {
            (None, None, None)
        };

        // convert page counts -> bytes if pagesize is available
        let pagesize_bytes = pagesize;
        let pages_active_bytes = pages_active.and_then(|p| pagesize_bytes.map(|ps| p * ps));
        let pages_inactive_bytes = pages_inactive.and_then(|p| pagesize_bytes.map(|ps| p * ps));
        let pages_free_bytes = pages_free.and_then(|p| pagesize_bytes.map(|ps| p * ps));

        let vm_cache = VmCacheInfo {
            page_filecache_min: vm_page_filecache_min,
            pageout_protected_sharedcache,
            pageout_forcereclaimed_sharedcache,
            apple_protect_pager_cache_limit,
            pagesize_bytes,
            pages_active_bytes,
            pages_inactive_bytes,
            pages_free_bytes,
        };

        // collect other debug/sysctl keys we saw in your sysctl output (non-exhaustive list)
        // You can expand this list as needed.
        let debug_keys = [
            "kern.kernelcacheuuid",
            "kern.namecache_disabled",
            "kern.flush_cache_on_write",
            "vfs.generic.nfs.server.reqcache_size",
            "vfs.generic.nfs.client.readlink_nocache",
            "vfs.generic.nfs.client.access_cache_timeout",
            "vfs.generic.lifs.read_meta_cache_hit",
            "vfs.generic.lifs.write_meta_cache_hit",
            "net.inet.ip.rtmaxcache",
            "net.inet.tcp.clear_tfocache",
            "net.inet.tcp.init_rtt_from_cache",
            "net.inet6.ip6.rtmaxcache",
            "debug.didevice_cache_fully_satisfied",
            "debug.didevice_cache_spared_bytes",
            "debug.didevice_thread_cache_reads",
            "debug.didevice_cache_size_default",
            "debug.didevice_enable_cache",
            "debug.iosa.mapper_cache_policy",
            "security.codesigning.trustcaches.num_static",
            "security.codesigning.trustcaches.num_engineering",
            "security.codesigning.trustcaches.num_loadable",
            "security.mac.amfi.trust_cache_interface",
            "security.mac.amfi.exec_requires_trustcache",
            "security.mac.asp.stats.cache_entry_count",
            "security.mac.asp.stats.cache_allocation_count",
            "security.mac.asp.stats.cache_release_count",
        ];

        let mut debug_map: HashMap<String, String> = HashMap::new();
        for &k in debug_keys.iter() {
            if let Some(v) = run_sysctl_n(k) {
                debug_map.insert(k.to_string(), v);
            }
        }
        let debug_sysctls = if debug_map.is_empty() {
            None
        } else {
            Some(debug_map)
        };

        Ok(CpuCacheInfo {
            cache_line_bytes,
            cache_l1i_bytes: cache_l1i,
            cache_l1d_bytes: cache_l1d,
            cache_l2_bytes: cache_l2,
            cache_l3_bytes: cache_l3,
            perflevel,
            cache_sizes_raw,
            cache_config_raw,
            vm_cache: Some(vm_cache),
            debug_sysctls,
        })
    }

    /// Tauri command: async wrapper that calls blocking collector in spawn_blocking
    #[command]
    pub async fn get_cache_info() -> Result<CpuCacheInfo, String> {
        match tauri::async_runtime::spawn_blocking(move || collect_cache_info_blocking()).await {
            Ok(Ok(info)) => Ok(info),
            Ok(Err(e)) => Err(format!("collect_cache_info error: {:?}", e)),
            Err(e) => Err(format!("task join error: {:?}", e)),
        }
    }
}
