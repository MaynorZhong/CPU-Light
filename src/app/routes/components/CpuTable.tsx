import ViewCard from "@/components/ViewCard";
import { useSysStore } from "@/store";
import { pick } from "@/utils/pick";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";
import { useShallow } from "zustand/shallow";

type CpuTableProps = {
  children?: ReactNode;
};

const CpuTable: FC<CpuTableProps> = props => {
  const { children } = props;

  const { cpuInfo } = useSysStore(useShallow(({ cpuInfo }) => ({ cpuInfo })));

  // @ts-expect-error 后端接口字段不固定 暂时忽略检查
  const { model_name, architecture, sysctl_map } = cpuInfo || {};

  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="处理器"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              名称
            </Table.Th>
            <Table.Td className="!text-left">{model_name || "-"}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              指令架构
            </Table.Th>
            <Table.Td className="!text-left">{architecture || "-"}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              体系架构
            </Table.Th>
            <Table.Td className="!text-left">
              {pick(sysctl_map, "hw.machine", "-")}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

export default memo(CpuTable);
