import { Table, Badge } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";

type SystemStatusTableProps = {
  children?: ReactNode;
};

const SystemStatusTable: FC<SystemStatusTableProps> = props => {
  const { children } = props;
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>CPU使用率</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="green" className="!h-2 !w-2" circle />
              <span>20%</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>内存使用率</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="orange" className="!h-2 !w-2" circle />
              <span>20%</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>磁盘使用</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="yellow" className="!h-2 !w-2" circle />
              <span>20%</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>设备温度</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="orange" className="!h-2 !w-2" circle />
              <span>20</span>
            </div>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(SystemStatusTable);
