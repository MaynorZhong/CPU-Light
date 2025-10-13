import React, { type ReactNode, FC, memo, useEffect } from "react";
import CacheTable from "./components/CacheTable";
import { useSysStore } from "@/store";
import { useTauriCommand } from "@/hooks";
import type { CacheInfo } from "@/types";
import { useShallow } from "zustand/shallow";

type CacheProps = {
  children: ReactNode;
};

const Cache: FC<CacheProps> = props => {
  const { children } = props;

  const { execute } = useTauriCommand<CacheInfo>("get_cache_info");

  const { setCacheInfo } = useSysStore(
    useShallow(({ setCacheInfo }) => ({
      setCacheInfo,
    }))
  );

  useEffect(() => {
    execute().then(res => {
      console.log("Cache Info:", res);
      setCacheInfo(res as CacheInfo);
    });
  }, []);
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
