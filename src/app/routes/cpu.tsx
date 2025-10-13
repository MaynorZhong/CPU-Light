import ViewCard from "@/components/ViewCard";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo, useEffect, useRef } from "react";
import CpuTable from "./components/CpuTable";
import ClockTable from "./components/ClockTable";
import CoreTable from "./components/CoreTable";
import OrderTable from "./components/OrderTable";
import PowerConsumptionTable from "./components/PowerConsumptionTable";
import { useTauriCommand } from "@/hooks";
import { useSysStore } from "@/store";
import { useShallow } from "zustand/shallow";
import ExtraCpuInfoTable from "./components/ExtraCpuInfoTable";

type CpuProps = {
  children?: ReactNode;
};

const Cpu: FC<CpuProps> = props => {
  const { children } = props;

  const intervalRef = useRef<number | null>(null);

  const { execute } = useTauriCommand("get_cpu_info");

  const { setCpuInfo } = useSysStore(
    useShallow(({ setCpuInfo }) => ({
      setCpuInfo,
    }))
  );

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      execute().then(res => {
        console.log("CPU Info:", res);
        setCpuInfo(res);
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <CpuTable />
      {/* <ClockTable /> */}
      <CoreTable />
      {/* <OrderTable /> */}
      {/* <PowerConsumptionTable /> */}
      <ExtraCpuInfoTable />
    </div>
  );
};

export default memo(Cpu);
