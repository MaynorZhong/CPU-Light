import { createFileRoute } from "@tanstack/react-router";

import { type ReactNode, FC, memo, useEffect, useRef } from "react";
import CpuTable from "../components/CpuTable";

import CoreTable from "../components/CoreTable";

import { useTauriCommand } from "@/hooks";
import { useSysStore } from "@/store";
import { useShallow } from "zustand/shallow";
import ExtraCpuInfoTable from "../components/ExtraCpuInfoTable";

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

const CpuMemoComponent = memo(Cpu);

export const Route = createFileRoute("/cpu")({
  component: CpuMemoComponent,
});

export default CpuMemoComponent;
