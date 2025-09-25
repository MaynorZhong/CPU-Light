import React, { type ReactNode, FC, memo } from "react";
import CacheTable from "./components/CacheTable";

type CacheProps = {
  children: ReactNode;
};

const Cache: FC<CacheProps> = props => {
  const { children } = props;
  return (
    <>
      <CacheTable>
        <CacheTable.L1 />
        <CacheTable.L2 />
      </CacheTable>
    </>
  );
};

export default memo(Cache);
