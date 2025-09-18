import ViewCard from "@/components/ViewCard";
import React, { type ReactNode, FC, memo } from "react";
import GPUInfoTable from "./components/GPUInfoTable";
import { IconDeviceGamepad2 } from "@tabler/icons-react";
import DisplayTable from "./components/DisplayTable";
import GPUPerformanceTable from "./components/GPUPerformanceTable";

type GpuProps = {
  children: ReactNode;
};

const Gpu: FC<GpuProps> = props => {
  const { children } = props;
  return (
    <div className="flex w-full flex-wrap items-center gap-[16px]">
      <ViewCard
        col={2}
        title="图形处理器"
        icon={<IconDeviceGamepad2 size={16} />}
      >
        <GPUInfoTable />
      </ViewCard>
      <ViewCard col={2} title="显示器" icon={<IconDeviceGamepad2 size={16} />}>
        <DisplayTable />
      </ViewCard>
      <ViewCard col={2} title="显示器" icon={<IconDeviceGamepad2 size={16} />}>
        <GPUPerformanceTable />
      </ViewCard>
    </div>
  );
};

export default memo(Gpu);
