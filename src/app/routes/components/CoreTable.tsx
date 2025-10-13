import ViewCard from "@/components/ViewCard";
import { useSysStore } from "@/store";
import type { CpuInfo } from "@/types";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";

type CoreTableProps = {
  children?: ReactNode;
};

const CoreTable: FC<CoreTableProps> = props => {
  const { children } = props;

  const { cpuInfo } = useSysStore(
    useShallow(({ cpuInfo }) => ({
      cpuInfo,
    }))
  );

  const { logical_cores, physical_cores, supports_virtualization } = (cpuInfo ||
    {}) as CpuInfo;

  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="核心"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              总核心数
            </Table.Th>
            <Table.Td className="!text-left">{logical_cores || "-"}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              逻辑核心数
            </Table.Th>
            <Table.Td className="!text-left">{logical_cores || "-"}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              物理核心数
            </Table.Th>
            <Table.Td className="!text-left">{physical_cores || "-"}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">SMT</Table.Th>
            <Table.Td className="!text-left">
              {logical_cores && physical_cores && logical_cores > physical_cores
                ? "启用"
                : "不可用"}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              虚拟化支持
            </Table.Th>
            <Table.Td className="!text-left">
              {supports_virtualization ? "支持" : "不支持"}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

export default memo(CoreTable);
