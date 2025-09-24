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

  /// 单位 Wh（如果能拿到）
  energy_wh: string;
  energy_full_wh: string;
  energy_design_wh: string;

  /// 电压 V（如果能拿到）
  voltage: string;

  /// 温度 °C（如果能拿到）
  temperature_c: string;

  /// 循环次数（如果能拿到）
  cycle_count: number;

  /// 估算到满/空的秒数（如果能拿到）
  time_to_full_seconds: number;
  time_to_empty_seconds: number;
}>;

type BatteryInfoType = {
  batteries: BatteriesType[];
  timestamp_unix: number;
};
