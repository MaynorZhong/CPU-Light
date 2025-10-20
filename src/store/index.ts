import type {
  BatteryInfoType,
  CacheInfo,
  DeviceInfoType,
  GPUInfo,
  HardwareDataType,
  LogicBoardInfo,
  MemoryInfoType,
  MemoryModuleInfo,
  NetworkStatusType,
  SysInfoType,
  SystemMetrics,
} from "@/types";
import { create } from "zustand";

interface State {
  sysInfo: SysInfoType | null;
  setSysInfo: (sysInfo: SysInfoType) => void;
  deviceInfo: DeviceInfoType | null;
  setDeviceInfo: (deviceInfo: DeviceInfoType) => void;
  hardwareInfo: HardwareDataType | null;
  setHardwareInfo: (hardwareInfo: HardwareDataType) => void;
  systemMetrics: SystemMetrics | null;
  setSystemMetrics: (systemMetrics: SystemMetrics) => void;
  batterieInfo: BatteryInfoType | null;
  setBatterieInfo: (batterieInfo: BatteryInfoType | null) => void;
  networkStatus: NetworkStatusType | null;
  setNetworkStatus: (networkStatus: NetworkStatusType | null) => void;
  cpuInfo: unknown;
  setCpuInfo: (cpuInfo: unknown) => void;
  cacheInfo: CacheInfo | null;
  setCacheInfo: (cacheInfo: CacheInfo | null) => void;
  logicBoardInfo: LogicBoardInfo | null;
  setLogicBoardInfo: (logicBoardInfo: LogicBoardInfo) => void;
  memoryInfo: MemoryInfoType | null;
  setMemoryInfo: (memoryInfo: MemoryInfoType) => void;
  memoryModules: MemoryModuleInfo[] | null;
  setMemoryModules: (memoryModules: MemoryModuleInfo[]) => void;
  gpuInfo: GPUInfo | null;
  setGpuInfo: (gpuInfo: GPUInfo) => void;
}

const useSysStore = create<State>(set => ({
  sysInfo: null,
  setSysInfo: sysInfo => set(() => ({ sysInfo })),
  deviceInfo: null,
  setDeviceInfo: deviceInfo => set(() => ({ deviceInfo })),
  hardwareInfo: null,
  setHardwareInfo: hardwareInfo => set(() => ({ hardwareInfo })),
  systemMetrics: null,
  setSystemMetrics: systemMetrics =>
    set(() => ({
      systemMetrics,
    })),
  batterieInfo: null,
  setBatterieInfo: batterieInfo => set(() => ({ batterieInfo })),
  networkStatus: null,
  setNetworkStatus: networkStatus => set(() => ({ networkStatus })),
  cpuInfo: null,
  setCpuInfo: cpuInfo => set(() => ({ cpuInfo })),
  cacheInfo: null,
  setCacheInfo: cacheInfo => set(() => ({ cacheInfo })),
  logicBoardInfo: null,
  setLogicBoardInfo: logicBoardInfo => set(() => ({ logicBoardInfo })),
  memoryInfo: null,
  setMemoryInfo: memoryInfo => set(() => ({ memoryInfo })),
  memoryModules: null,
  setMemoryModules: memoryModules => set(() => ({ memoryModules })),
  gpuInfo: null,
  setGpuInfo: gpuInfo => set(() => ({ gpuInfo })),
}));

export { useSysStore };
