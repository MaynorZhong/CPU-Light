import ViewCard from "@/components/ViewCard";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo, useEffect } from "react";
import CpuTable from "./components/CpuTable";
import ClockTable from "./components/ClockTable";
import CoreTable from "./components/CoreTable";
import OrderTable from "./components/OrderTable";
import PowerConsumptionTable from "./components/PowerConsumptionTable";
import { useTauriCommand } from "@/hooks";
import { useSysStore } from "@/store";
import { useShallow } from "zustand/shallow";

type CpuProps = {
  children?: ReactNode;
};

const Cpu: FC<CpuProps> = props => {
  const { children } = props;

  const { execute } = useTauriCommand("get_cpu_info");

  const { setCpuInfo } = useSysStore(
    useShallow(({ setCpuInfo }) => ({
      setCpuInfo,
    }))
  );

  useEffect(() => {
    execute().then(res => {
      console.log("CPU Info:", res);
      setCpuInfo(res);
    });
  }, []);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <CpuTable />
      <ClockTable />
      <CoreTable />
      <OrderTable />
      <PowerConsumptionTable />
    </div>
  );
};

export default memo(Cpu);
