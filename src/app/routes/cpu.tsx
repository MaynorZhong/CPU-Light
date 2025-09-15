import React, { type ReactNode, FC, memo } from "react";

type CpuProps = {
  children?: ReactNode;
};

const Cpu: FC<CpuProps> = props => {
  const { children } = props;
  return <div>Cpu</div>;
};

export default memo(Cpu);
