import { useSysStore } from "@/store";
import { Table, Badge } from "@mantine/core";
import React, { type ReactNode, FC, memo, useMemo } from "react";
import { useShallow } from "zustand/shallow";

type SystemStatusTableProps = {
  children?: ReactNode;
};

const SystemStatusTable: FC<SystemStatusTableProps> = props => {
  const { children } = props;

  const { systemMetrics } = useSysStore(
    useShallow(({ systemMetrics }) => ({
      systemMetrics,
    }))
  );

  const diskUsage = useMemo(() => {
    const disk = systemMetrics?.disks?.[0];
    if (
      !disk ||
      disk.total == null ||
      disk.available == null ||
      disk.total === 0
    )
      return "-";
    const usage = ((disk.total - disk.available) / disk.total) * 100;
    return usage.toFixed(1);
  }, [systemMetrics?.disks]);
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>CPU使用率</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="green" className="!h-2 !w-2" circle />
              <span>
                {systemMetrics?.cpu_usage_percent
                  ? `${Number(systemMetrics.cpu_usage_percent).toFixed(1)}%`
                  : "-"}
              </span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>内存使用率</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="orange" className="!h-2 !w-2" circle />
              <span>
                {systemMetrics?.total_memory_kb && systemMetrics.used_memory_kb
                  ? (
                      Number(
                        systemMetrics.used_memory_kb /
                          systemMetrics.total_memory_kb
                      ) * 100
                    ).toFixed(1) + "%"
                  : "-"}
              </span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>磁盘使用</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="yellow" className="!h-2 !w-2" circle />
              <span>{diskUsage !== "-" ? `${diskUsage}%` : "-"}</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>设备温度</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="orange" className="!h-2 !w-2" circle />
              <span>-</span>
            </div>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(SystemStatusTable);
