import ViewCard from "@/components/ViewCard";
import { useSysStore } from "@/store";
import type { CacheInfo } from "@/types";
import { byteToKB } from "@/utils/byte-to-kb";
import { Table } from "@mantine/core";
import React, { type ReactNode, createContext, FC, useContext } from "react";

import { useShallow } from "zustand/shallow";

const CacheInfoContext = createContext<CacheInfo | null>(null);

const useCacheInfo = () => useContext(CacheInfoContext);

type CacheTableProps = {
  children?: ReactNode;
};

type CacheTableComponent = FC<CacheTableProps>;

const CacheTable: CacheTableComponent = props => {
  const { children, ...restProps } = props;

  const { cacheInfo } = useSysStore(
    useShallow(({ cacheInfo }) => ({ cacheInfo }))
  );

  return (
    <CacheInfoContext.Provider value={cacheInfo}>
      <div {...restProps} className="flex w-full flex-col gap-4">
        {children}
      </div>
    </CacheInfoContext.Provider>
  );
};

type PerfLevel = {
  l1d_bytes: number;
  l1i_bytes: number;
  l2_bytes: number;
};

const CacheTablePerflevel = () => {
  const cacheInfo = useCacheInfo();

  const perfLevels = (
    cacheInfo?.perflevel ? Object.values(cacheInfo.perflevel) : []
  ) as PerfLevel[];

  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="性能级别（核心簇）缓存"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          {perfLevels.length ? (
            perfLevels.map((item, index) => {
              return (
                <>
                  <Table.Tr>
                    <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
                      等级{index + 1}L1指令缓存
                    </Table.Th>
                    <Table.Td className="!text-left">
                      {byteToKB(item.l1d_bytes || 0)} KB
                    </Table.Td>
                  </Table.Tr>

                  <Table.Tr>
                    <Table.Th className="border-r-1 border-[#f8f9fa]">
                      等级{index + 1}L1 数据缓存(kb)
                    </Table.Th>
                    <Table.Td className="!text-left">
                      {byteToKB(item.l1i_bytes || 0)} KB
                    </Table.Td>
                  </Table.Tr>

                  <Table.Tr>
                    <Table.Th className="border-r-1 border-[#f8f9fa]">
                      等级{index + 1}L2 数据缓存(kb)
                    </Table.Th>
                    <Table.Td className="!text-left">
                      {byteToKB(item.l2_bytes || 0)} KB
                    </Table.Td>
                  </Table.Tr>
                </>
              );
            })
          ) : (
            <Table.Tr>
              <Table.Td className="!text-left">暂无数据</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

const CacheTableL2 = () => {
  const cacheInfo = useCacheInfo();
  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="CPU缓存"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              L2 缓存
            </Table.Th>
            <Table.Td className="!text-left">
              {byteToKB(cacheInfo?.cache_l1i_bytes || 0)} KB
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

export default Object.assign(CacheTable, {
  L1: CacheTablePerflevel,
  L2: CacheTableL2,
});
