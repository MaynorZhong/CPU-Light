import ViewCard from "@/components/ViewCard";
import { type ReactNode, FC, memo, useEffect } from "react";
import GPUInfoTable from "./components/GPUInfoTable";
import { IconDeviceGamepad2 } from "@tabler/icons-react";
import DisplayTable from "./components/DisplayTable";

import { useTauriCommand } from "@/hooks";
import { useSysStore } from "@/store";
import { useShallow } from "zustand/shallow";
import type { GPUInfo } from "@/types";

type GpuProps = {
  children: ReactNode;
};

const Gpu: FC<GpuProps> = props => {
  const { children } = props;

  const { execute } = useTauriCommand("get_gpu_info");

  const { setGpuInfo } = useSysStore(
    useShallow(({ setGpuInfo }) => ({ setGpuInfo }))
  );

  useEffect(() => {
    execute().then(res => {
      console.log("GPU Info:", res);
      setGpuInfo(res as GPUInfo);
    });
  }, []);
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
      {/* <ViewCard col={2} title="显示器" icon={<IconDeviceGamepad2 size={16} />}>
        <GPUPerformanceTable />
      </ViewCard> */}
    </div>
  );
};

export default memo(Gpu);
