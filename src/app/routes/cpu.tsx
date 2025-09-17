import ViewCard from "@/components/ViewCard";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";
import CpuTable from "./components/CpuTable";
import ClockTable from "./components/ClockTable";
import CoreTable from "./components/CoreTable";
import OrderTable from "./components/OrderTable";
import PowerConsumptionTable from "./components/PowerConsumptionTable";

type CpuProps = {
  children?: ReactNode;
};

const Cpu: FC<CpuProps> = props => {
  const { children } = props;
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
