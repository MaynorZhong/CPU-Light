import { Container } from "@mantine/core";
import ViewCard from "@/components/ViewCard";

import EquipmentTable from "./components/EquipmentTable";
import SystemStatusTable from "./components/SystemStatusTable";
import BatteryTable from "./components/BatteryTable";
import NetworkTable from "./components/NetworkTable";

import {
  IconAdjustmentsCog,
  IconBattery,
  IconDeviceImacFilled,
  IconNetwork,
} from "@tabler/icons-react";
import { useTauriCommand } from "@/hooks";
import { useEffect, useRef, useState } from "react";
import { useSysStore } from "@/store";
import { useShallow } from "zustand/shallow";

function Home() {
  const { execute } = useTauriCommand<SysInfoType>("get_system_info");
  const { execute: loadMapExecutor } = useTauriCommand("load_map");
  const { execute: getDeviceInfoExecutor } = useTauriCommand("get_device_info");
  const { execute: getHardwareDataExecutor } =
    useTauriCommand("get_hardware_data");
  const { execute: getSystemMetricsExecutor } =
    useTauriCommand("get_system_metrics");
  const { execute: getBatteryInfoExecutor } =
    useTauriCommand("get_battery_info");

  const intervelRef = useRef<number | null>();

  const [mapData, setMapData] = useState<MacOSMapEntry[] | null>(null);

  const {
    sysInfo,
    setSysInfo,
    deviceInfo,
    setDeviceInfo,
    hardwareInfo,
    setHardwareInfo,
    systemMetrics,
    setSystemMetrics,
    batterieInfo,
    setBatterieInfo,
  } = useSysStore(
    useShallow(
      ({
        sysInfo,
        setSysInfo,
        deviceInfo,
        setDeviceInfo,
        hardwareInfo,
        setHardwareInfo,
        systemMetrics,
        setSystemMetrics,
        batterieInfo,
        setBatterieInfo,
      }) => ({
        sysInfo,
        setSysInfo,
        deviceInfo,
        setDeviceInfo,
        hardwareInfo,
        setHardwareInfo,
        systemMetrics,
        setSystemMetrics,
        batterieInfo,
        setBatterieInfo,
      })
    )
  );

  useEffect(() => {
    execute().then(res => {
      setSysInfo(res);
    });
    loadMapExecutor().then(res => {
      console.log("load_map result:", res);
      setMapData(res as MacOSMapEntry[]);
    });
    getDeviceInfoExecutor().then(res => {
      console.log("get_device_info result:", res);
      setDeviceInfo(res as DeviceInfoType);
    });

    getHardwareDataExecutor().then(res => {
      setHardwareInfo(res as HardwareDataType);
    });

    const id = window.setInterval(() => {
      getSystemMetricsExecutor().then(res => {
        console.log("get_system_metrics", res);
        setSystemMetrics(res as SystemMetrics);
      });
      getBatteryInfoExecutor().then(res => {
        console.log("get_battery_info", res);
        setBatterieInfo(res as BatteryInfoType);
      });
    }, 5000);

    intervelRef.current = id;

    return () => {
      if (intervelRef.current) {
        clearInterval(intervelRef.current);
      }
    };
  }, []);

  return (
    <div className="flex w-full flex-col justify-center">
      <Container className="h-56 w-full rounded-2xl bg-linear-135 from-[#007aff] to-[#5ac8fa]">
        <div className="flex h-full w-full flex-col items-center justify-center text-white">
          <div
            className="flex h-[80px] w-[80px] items-center justify-center rounded-2xl"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"></path>
            </svg>
          </div>
          <div className="mt-4 text-[28px] font-bold">
            {`macOS ${
              mapData?.find(
                item =>
                  item.product_version === sysInfo?.os_version?.split(".")[0]
              )?.marketing_name || ""
            }`}
          </div>
          <div className="text-[16px] font-semibold">{sysInfo?.os_version}</div>
        </div>
      </Container>
      <div className="mt-6 flex w-full flex-wrap gap-[16px]">
        <ViewCard
          col={2}
          title="设备信息"
          icon={<IconAdjustmentsCog size={16} />}
        >
          <EquipmentTable />
        </ViewCard>
        <ViewCard
          col={2}
          title="系统状态"
          icon={<IconDeviceImacFilled size={16} />}
        >
          <SystemStatusTable />
        </ViewCard>
        <ViewCard col={2} title="电池状态" icon={<IconBattery size={16} />}>
          <BatteryTable />
        </ViewCard>
        <ViewCard col={2} title="网络状态" icon={<IconNetwork size={16} />}>
          <NetworkTable />
        </ViewCard>
      </div>
    </div>
  );
}

export default Home;
