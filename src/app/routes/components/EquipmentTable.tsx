import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";

type EquipmentTableProps = {
  children?: ReactNode;
};

const EquipmentTable: FC<EquipmentTableProps> = props => {
  const { children } = props;
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>设备信息</Table.Th>
          <Table.Td>MacBook Pro 16-inch, 2023</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>设备标识符</Table.Th>
          <Table.Td>Mac14,6</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>序列号</Table.Th>
          <Table.Td>FHJSDHJSD</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>启动时间</Table.Th>
          <Table.Td>3天12小时45分钟</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(EquipmentTable);
