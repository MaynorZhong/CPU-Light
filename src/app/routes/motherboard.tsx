import React, { type ReactNode, FC, memo } from "react";

type MotherboardProps = {
  children?: ReactNode;
};

const Motherboard: FC<MotherboardProps> = props => {
  const { children } = props;
  return <div>motherboard</div>;
};

export default memo(Motherboard);
