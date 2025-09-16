import ViewCard from "@/components/ViewCard";
import React, { type ReactNode, FC, memo } from "react";

type CpuProps = {
  children?: ReactNode;
};

const Cpu: FC<CpuProps> = props => {
  const { children } = props;
  return (
    <div className="flex w-full flex-col items-center">
      <ViewCard
        col={1}
        gap={0}
        headerClass={{
          backgroundColor: "#015CE1",
          color: "#fff",
        }}
        title="测试"
      ></ViewCard>
    </div>
  );
};

export default memo(Cpu);
