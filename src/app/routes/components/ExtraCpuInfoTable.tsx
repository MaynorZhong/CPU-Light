import ViewCard from "@/components/ViewCard";
import { useSysStore } from "@/store";
import type { CpuInfo } from "@/types";
import { Table } from "@mantine/core";
import { type ReactNode, FC, memo } from "react";
import { useShallow } from "zustand/shallow";

type ExtraCpuInfoTableProps = {
  children?: ReactNode;
};

const ExtraCpuInfoTable: FC<ExtraCpuInfoTableProps> = props => {
  const { children } = props;

  const { cpuInfo } = useSysStore(
    useShallow(({ cpuInfo }) => ({
      cpuInfo,
    }))
  );

  const {
    packages: cpuPackage,
    cpu_usage_percent,
    process_stats,
  } = (cpuInfo || {}) as CpuInfo;

  const { threads, total, running, sleeping } = process_stats || {};
  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="进程"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              CPU总占用
            </Table.Th>
            <Table.Td className="!text-left">
              {cpu_usage_percent ? `${cpu_usage_percent.toFixed(1)} %` : "-"}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>

        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              CPU物理插槽数
            </Table.Th>
            <Table.Td className="!text-left">{cpuPackage || "-"}</Table.Td>
          </Table.Tr>
        </Table.Tbody>

        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              线程
            </Table.Th>
            <Table.Td className="!text-left">{threads || "-"}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              总进程数
            </Table.Th>
            <Table.Td className="!text-left">{total || "-"}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              睡眠进程数
            </Table.Th>
            <Table.Td className="!text-left">{sleeping || "-"}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              运行中的进程数
            </Table.Th>
            <Table.Td className="!text-left">{running || "-"}</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

export default memo(ExtraCpuInfoTable);
