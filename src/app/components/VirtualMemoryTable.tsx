import { useSysStore } from "@/store";
import type { MemoryInfoType } from "@/types";
import { byteToGB } from "@/utils/byte";
import { Badge, Table, Tooltip } from "@mantine/core";
import { type ReactNode, FC, useMemo } from "react";
import { useShallow } from "zustand/shallow";

type VirtualMemoryTableProps = {
  children?: ReactNode;
};

const VirtualMemoryTableSwap = () => {
  const { memoryInfo } = useSysStore(
    useShallow(({ memoryInfo }) => ({
      memoryInfo,
    }))
  );

  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>交换区总量</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <span>
                {memoryInfo?.swap_total_bytes
                  ? byteToGB(memoryInfo?.swap_total_bytes) + "GB"
                  : "-"}
              </span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>已用交换空间</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <span>
                {memoryInfo?.swap_used_bytes
                  ? byteToGB(memoryInfo?.swap_used_bytes) + "GB"
                  : "-"}
              </span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>可用交换空间</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <span>
                {memoryInfo?.swap_free_bytes
                  ? byteToGB(memoryInfo?.swap_free_bytes) + "GB"
                  : "-"}
              </span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>交换区使用率</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <span>
                {memoryInfo?.swap_used_percent
                  ? memoryInfo.swap_used_percent.toFixed(1) + "%"
                  : "-"}
              </span>
            </div>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

interface VirtualMemoryTableComponent extends FC<VirtualMemoryTableProps> {
  Swap?: FC;
}

const VirtualMemoryTable: VirtualMemoryTableComponent = props => {
  const { children } = props;

  const { memoryInfo } = useSysStore(
    useShallow(({ memoryInfo }) => ({
      memoryInfo,
    }))
  );

  const memoryPressure = useMemo(() => {
    if (
      !memoryInfo ||
      !memoryInfo.compressor_bytes ||
      !memoryInfo.total_physical_bytes
    )
      return "未知";
    const { compressor_bytes, total_physical_bytes } =
      memoryInfo as MemoryInfoType;

    const pressureScore = compressor_bytes! / total_physical_bytes!;
    if (pressureScore < 0.1) return "低";
    if (pressureScore < 0.25) return "轻度";
    if (pressureScore < 0.5) return "中度";
    return "严重";
  }, [memoryInfo]);

  const pressureColor = useMemo(() => {
    switch (memoryPressure) {
      case "低":
        return "green";
      case "轻度":
        return "yellow";
      case "中度":
        return "orange";
      case "严重":
        return "red";
      default:
        return "gray";
    }
  }, [memoryPressure]);
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>压缩内存</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <span>
                {memoryInfo?.compressor_bytes
                  ? byteToGB(memoryInfo?.compressor_bytes) + "GB"
                  : "-"}
              </span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>内存压力</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color={pressureColor} className="!h-2 !w-2" circle />
              <span>{memoryPressure}</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>内核占用</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <span>
                {memoryInfo?.wired_bytes
                  ? byteToGB(memoryInfo.wired_bytes) + "GB"
                  : "-"}
              </span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>top输出汇总</Table.Th>
          <Table.Td>
            <Tooltip label={memoryInfo?.top_physmem_line || ""} withArrow>
              <div className="flex items-center justify-end gap-2">
                <span className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {memoryInfo?.top_physmem_line
                    ? memoryInfo.top_physmem_line
                    : "-"}
                </span>
              </div>
            </Tooltip>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default Object.assign(VirtualMemoryTable, {
  Swap: VirtualMemoryTableSwap,
});
