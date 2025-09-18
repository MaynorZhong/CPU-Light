import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";
import { Progress } from "@mantine/core";

type MemoryTableProps = {
  children?: ReactNode;
};

const MemoryTable: FC<MemoryTableProps> = props => {
  const { children } = props;
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>总内存</Table.Th>
          <Table.Td>24GB</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>已用内存</Table.Th>
          <Table.Td>
            <div>
              <span>12GB</span>
              <Progress value={20} size="lg" className="mt-1" />
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>可用内存</Table.Th>
          <Table.Td>11.5 GB</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>内存类型</Table.Th>
          <Table.Td>LPDDR5 </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(MemoryTable);
