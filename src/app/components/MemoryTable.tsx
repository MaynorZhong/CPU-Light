import { Table } from "@mantine/core";
import { type ReactNode, FC, memo } from "react";
import { Progress } from "@mantine/core";
import { useSysStore } from "@/store";
import { useShallow } from "zustand/shallow";
import { byteToGB } from "@/utils/byte";

type MemoryTableProps = {
  children?: ReactNode;
};

const MemoryTable: FC<MemoryTableProps> = props => {
  const { children } = props;

  const { memoryInfo } = useSysStore(
    useShallow(({ memoryInfo }) => ({
      memoryInfo,
    }))
  );

  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>总内存</Table.Th>
          <Table.Td>
            {memoryInfo?.total_physical_bytes
              ? (memoryInfo.total_physical_bytes / 1024 ** 3).toFixed(0) + " GB"
              : "-"}
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>已用内存</Table.Th>
          <Table.Td>
            <div>
              <span>
                {memoryInfo?.used_bytes
                  ? byteToGB(memoryInfo?.used_bytes) + "GB"
                  : "-"}
              </span>
              <Progress
                value={
                  memoryInfo?.mem_used_percent
                    ? memoryInfo?.mem_used_percent
                    : 0
                }
                size="lg"
                className="mt-1"
              />
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>可用内存</Table.Th>
          <Table.Td>
            {memoryInfo?.free_bytes
              ? (memoryInfo.free_bytes / 1024 ** 3).toFixed(1) + " GB"
              : "-"}
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>内存使用率</Table.Th>
          <Table.Td>
            {memoryInfo?.mem_used_percent
              ? memoryInfo?.mem_used_percent.toFixed(1) + "%"
              : 0}
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(MemoryTable);
