import { Badge, Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";
import { Progress } from "@mantine/core";

type BatteryTableProps = {
  children?: ReactNode;
};

const BatteryTable: FC<BatteryTableProps> = props => {
  const { children } = props;
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>电池电量</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="green" className="!h-2 !w-2" circle />
              <span>20%</span>
            </div>
            <Progress value={20} size="lg" className="mt-1" />
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>充电状态</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="orange" className="!h-2 !w-2" circle />
              <span>未充电</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>电池健康</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="yellow" className="!h-2 !w-2" circle />
              <span>正常</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>循环计数</Table.Th>
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

export default memo(BatteryTable);
