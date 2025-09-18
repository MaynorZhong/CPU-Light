import { Badge, Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";

type VirtualMemoryTableProps = {
  children?: ReactNode;
};

const VirtualMemoryTable: FC<VirtualMemoryTableProps> = props => {
  const { children } = props;
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>交换区使用</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <span>2.1G</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>内存压力</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="orange" className="!h-2 !w-2" circle />
              <span>中等</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>页面换入</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <span>1232</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>页面换出</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <span>204</span>
            </div>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(VirtualMemoryTable);
