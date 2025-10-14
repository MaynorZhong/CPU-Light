type SysInfoType = Partial<{
  os_name: string;
  os_version: string;
  kernel_version: string;
  cpu_count: number;
  total_memory_mb: number;
  available_memory_mb: number;
  hostname: string;
}>;

type MacOSMapEntry = {
  product_version: string;
  marketing_name: string;
};

type DeviceInfoType = Partial<{
  serial_number: string;
  model_identifier: string;
  boot_time_utc: string;
  uptime_seconds: number;
}>;

type SystemMetrics = Partial<{
  cpu_usage_percent: string;
  total_memory_kb: number;
  used_memory_kb: number;
  disks: DiskInfo[];
  temps: unknown;
}>;

type DiskInfo = Partial<{
  name: string;
  mount_point: string;
  total: number;
  available: number;
}>;

type HardwareDataType = {
  model_name: string; // 兼容性尝试
  model_identifier: string;
  model_number: string;
  chip: string;
  total_number_of_cores: string;
  memory: string;
  system_firmware_version: string;
  os_loader_version: string;
  serial_number_system: string;
  hardware_uuid: string;
  provisioning_udid: string;
  activation_lock_status: string;
};

type BatteriesType = Partial<{
  vendor: string;
  model: string;
  serial_number: string;

  /// Charging / Discharging / Full / Unknown
  state: string;

  /// 0.0 - 100.0
  percentage: string;

  // 当前原始容量
  apple_raw_current_capacity: number;

  // 原始最大容量
  apple_raw_max_capacity: number;
  // 设计容量
  design_capacity: number;

  // 当前容量 最大容量
  current_capacity: number;
  max_capacity: number;

  time_to_full_seconds: number;
  time_to_empty_seconds: number;
  avg_time_to_full: number;

  /// 电压 mv（如果能拿到）
  voltage: number;

  /// 温度 °C（如果能拿到）
  temperature_c: string;

  /// 循环次数（如果能拿到）
  cycle_count: number;
}>;

type BatteryInfoType = {
  batteries: BatteriesType[];
  timestamp_unix: number;
};

type InterfaceType = Partial<{
  name: string;
  mac: string;
  ips: string[];
  is_up: boolean;
  is_loopback: boolean;
  mtu: number;
}>;

type WifiInfoType = Partial<{
  ssid: string;
  bssid: string;
  signal_dbm: number;
  frequency_mhz: number;
  iface: string;
}>;

type NetworkStatusType = Partial<{
  interfaces: InterfaceType[];
  online: boolean;
  default_gateway: string;
  dns_servers: string[];
  wifi: WifiInfoType | null;
  lic_ip: string;
  public_ip: string;
}>;

type ProcessStats = Partial<{
  total: string; // 总进程数
  running: string; // 运行中
  sleeping: string; // 睡眠
  threads: string; // 线程数
}>;

type CpuInfo = Partial<{
  model_name: string; // e.g. "Apple M4" or "Intel(R) Core(TM) i7-..."
  architecture: string; // "arm64" / "x86_64"
  physical_cores: number;
  logical_cores: number;
  cpu_frequency_hz: number; // current or typical base freq
  cpu_frequency_max_hz: number;

  // runtime / dynamic
  loadavg_1: number;
  loadavg_5: number;
  loadavg_15: number;
  uptime_seconds: number;

  // totals / summary usage (best-effort)
  cpu_usage_percent: number; // total CPU usage % (approx via sampling)
  per_core_usage_percent: any; // optional: null if not collected

  // temperature & powermetrics (optional, may be null)
  powermetrics_raw: string; // raw output if powermetrics ran
  cpu_temperature_c: number; // parsed or null

  // other useful raw data
  sysctl_map: Record<string, string>; // collected sysctl key -> value (for debugging)
  timestamp_unix: number;
  supports_virtualization: boolean;
  packages: number;
  process_stats: ProcessStats;
}>;

type PerflevelCacheType = Partial<{
  l1i_bytes: number;
  l1d_bytes: number;
  l2_bytes: number;
}>;

type VmCacheInfo = Partial<{
  page_filecache_min: number;
  pageout_protected_sharedcache: number;
  pageout_forcereclaimed_sharedcache: number;
  apple_protect_pager_cache_limit: number;
  pagesize_bytes: number;
  pages_active_bytes: number;
  pages_inactive_bytes: number;
  pages_free_bytes: number;
}>;

type CacheInfo = Partial<{
  cache_line_bytes: number;
  cache_l1i_bytes: number;
  cache_l1d_bytes: number;
  cache_l2_bytes: number;
  cache_l3_bytes: number;

  // perflevel indexed caches (e.g. perflevel0, perflevel1)
  perflevel: any;

  // raw arrays for advanced debugging
  cache_sizes_raw: number[];
  cache_config_raw: number[];

  // vm / page-cache related (dynamic / optional)
  vm_cache: VmCacheInfo | null;

  // debug: store other sysctl key->value pairs that are cache-related but not shown in overview
  debug_sysctls: Record<string, string>;
}>;

export type {
  SysInfoType,
  CpuInfo,
  MacOSMapEntry,
  DeviceInfoType,
  SystemMetrics,
  DiskInfo,
  HardwareDataType,
  BatteryInfoType,
  BatteriesType,
  InterfaceType,
  WifiInfoType,
  NetworkStatusType,
  PerflevelCacheType,
  VmCacheInfo,
  CacheInfo,
};
