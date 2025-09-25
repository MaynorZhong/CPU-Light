import { Badge, Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";

type NetworkTableProps = {
  children?: ReactNode;
};

const NetworkTable: FC<NetworkTableProps> = props => {
  const { children } = props;
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>WIFI</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="green" className="!h-2 !w-2" circle />
              <span>已连接</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>网关</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="orange" className="!h-2 !w-2" circle />
              <span>20%</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>IP地址</Table.Th>
          <Table.Td>
            <span>192.168.1.10</span>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>DNS服务器</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <span>233.5.5.5,233.6.6.6</span>
            </div>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(NetworkTable);
