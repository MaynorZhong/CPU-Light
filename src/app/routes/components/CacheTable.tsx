import ViewCard from "@/components/ViewCard";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";

type CacheTableProps = {
  children?: ReactNode;
};

type CacheTableComponent = FC<CacheTableProps> & {
  L1: FC;
  L2: FC;
};

const CacheTable: CacheTableComponent = props => {
  const { children, ...restProps } = props;
  return (
    <div {...restProps} className="flex w-full flex-col gap-4">
      {children}
    </div>
  );
};

CacheTable.L1 = () => (
  <ViewCard
    col={1}
    gap={0}
    headerClass={{
      backgroundColor: "#015CE1",
      color: "#fff",
    }}
    title="L1缓存"
  >
    <Table variant="vertical" layout="fixed" withTableBorder>
      <Table.Tbody>
        <Table.Tr>
          <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
            L1 指令缓存
          </Table.Th>
          <Table.Td className="!text-left">7.x migration</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th className="border-r-1 border-[#f8f9fa]">
            L1 数据缓存
          </Table.Th>
          <Table.Td className="!text-left">Open</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  </ViewCard>
);
CacheTable.L2 = () => (
  <ViewCard
    col={1}
    gap={0}
    headerClass={{
      backgroundColor: "#015CE1",
      color: "#fff",
    }}
    title="L2缓存"
  >
    <Table variant="vertical" layout="fixed" withTableBorder>
      <Table.Tbody>
        <Table.Tr>
          <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
            L2 指令缓存
          </Table.Th>
          <Table.Td className="!text-left">7.x migration</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th className="border-r-1 border-[#f8f9fa]">
            L2 数据缓存
          </Table.Th>
          <Table.Td className="!text-left">Open</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  </ViewCard>
);

export default CacheTable;
