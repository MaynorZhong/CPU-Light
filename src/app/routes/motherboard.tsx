import React, { type ReactNode, FC, memo } from "react";
import BoardTable from "./components/BoardTable";

type MotherboardProps = {
  children?: ReactNode;
};

const Motherboard: FC<MotherboardProps> = props => {
  const { children } = props;
  return (
    <div>
      <BoardTable />
    </div>
  );
};

export default memo(Motherboard);
