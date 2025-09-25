import { Progress, Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";

type GPUInfoTableProps = {
  children?: ReactNode;
};

const GPUInfoTable: FC<GPUInfoTableProps> = props => {
  const { children } = props;
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>GPU型号</Table.Th>
          <Table.Td>Apple M3 Pro (18核GPU)</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>GPU核心</Table.Th>
          <Table.Td>18核</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>统一内存</Table.Th>
          <Table.Td>36 GB</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>Metal支持</Table.Th>
          <Table.Td>Metal 3</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(GPUInfoTable);
