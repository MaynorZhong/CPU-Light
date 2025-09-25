import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";

type DisplayTableProps = {
  children?: ReactNode;
};

const DisplayTable: FC<DisplayTableProps> = props => {
  const { children } = props;
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>内置显示器</Table.Th>
          <Table.Td>16.2英寸 Liquid Retina XDR</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>分辨率</Table.Th>
          <Table.Td>3456 × 2234</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>像素密度</Table.Th>
          <Table.Td>254 PPI</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>颜色深度</Table.Th>
          <Table.Td>10-bit HDR</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(DisplayTable);
