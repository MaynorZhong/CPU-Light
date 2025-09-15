import React, { type ReactNode, FC, memo } from "react";

type MemoryProps = {
  children: ReactNode;
};

const Memory: FC<MemoryProps> = props => {
  const { children } = props;
  return <div>Memory</div>;
};

export default memo(Memory);
