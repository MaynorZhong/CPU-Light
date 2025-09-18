import ViewCard from "@/components/ViewCard";
import {
  IconBrandOnedrive,
  IconDatabase,
  IconDeviceImacFilled,
} from "@tabler/icons-react";
import React, { type ReactNode, FC, memo } from "react";

import MemoryTable from "./components/MemoryTable";
import VirtualMemoryTable from "./components/VirtualMemoryTable";
import { Table } from "@mantine/core";

type MemoryProps = {
  children: ReactNode;
};

const Memory: FC<MemoryProps> = props => {
  const { children } = props;
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="mt-6 flex w-full flex-wrap gap-[16px]">
        <ViewCard col={2} title="内存信息" icon={<IconDatabase size={16} />}>
          <MemoryTable />
        </ViewCard>
        <ViewCard
          col={2}
          title="虚拟内存"
          icon={<IconBrandOnedrive size={16} />}
        >
          <VirtualMemoryTable />
        </ViewCard>
      </div>
      <ViewCard
        col={1}
        gap={0}
        headerClass={{
          backgroundColor: "#015CE1",
          color: "#fff",
        }}
        title="内存插槽信息"
      >
        <Table variant="vertical" layout="fixed" withTableBorder>
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
                内存类型
              </Table.Th>
              <Table.Td className="!text-left">LPDDR5 统一内存</Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th className="border-r-1 border-[#f8f9fa]">
                总容量
              </Table.Th>
              <Table.Td className="!text-left">36 GB</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </ViewCard>
    </div>
  );
};

export default memo(Memory);
