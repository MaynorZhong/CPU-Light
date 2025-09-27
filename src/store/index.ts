import type {
  BatteryInfoType,
  DeviceInfoType,
  HardwareDataType,
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
}));

export { useSysStore };
