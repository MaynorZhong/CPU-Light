import React, { type ReactNode, FC, memo } from "react";

type GpuProps = {
  children: ReactNode;
};

const Gpu: FC<GpuProps> = props => {
  const { children } = props;
  return <div>Gpu</div>;
};

export default memo(Gpu);
