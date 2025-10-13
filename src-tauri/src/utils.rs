pub mod utils {
    use std::process::Command;

    /// 运行 sysctl -n <key> 并返回 trimmed stdout（简单 helper）
    pub fn run_sysctl_n(key: &str) -> Option<String> {
        if let Ok(out) = Command::new("sysctl").arg("-n").arg(key).output() {
            if out.status.success() {
                if let Ok(s) = String::from_utf8(out.stdout) {
                    return Some(s.trim().to_string());
                }
            }
        }
        None
    }
}
