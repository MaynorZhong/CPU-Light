import React, { type ReactNode, FC, memo, useEffect, useRef } from "react";
import BatteryDetail from "./components/BatteryDetail";
import { useTauriCommand } from "@/hooks";
import { useSysStore } from "@/store";
import { useShallow } from "zustand/shallow";
import type { BatteryInfoType } from "@/types";

type BatteryProps = {
  children: ReactNode;
};

const Battery: FC<BatteryProps> = props => {
  const { children } = props;
  const { execute } = useTauriCommand("get_battery_info");
  const { setBatterieInfo } = useSysStore(
    useShallow(({ setBatterieInfo }) => ({
      setBatterieInfo,
    }))
  );

  const intervalRef = useRef<number | null>(null);

  const getBatteryInfo = async () => {
    try {
      const batteryInfo = await execute();
      console.log("Battery Info:", batteryInfo);
      setBatterieInfo(batteryInfo as BatteryInfoType);
    } catch (error) {
      console.error("Failed to get battery info:", error);
    }
  };

  useEffect(() => {
    // initial fetch
    getBatteryInfo();
    // set repeating interval
    intervalRef.current = window.setInterval(() => {
      getBatteryInfo();
    }, 10000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <BatteryDetail />
    </div>
  );
};

export default memo(Battery);
