import { useSysStore } from "@/store";
import { Badge, Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";
import { useShallow } from "zustand/shallow";

type NetworkTableProps = {
  children?: ReactNode;
};

const NetworkTable: FC<NetworkTableProps> = props => {
  const { children } = props;

  const { networkStatus } = useSysStore(
    useShallow(({ networkStatus }) => ({
      networkStatus,
    }))
  );
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>网络状态</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge
                color={networkStatus?.online ? "green" : "orange"}
                className="!h-2 !w-2"
                circle
              />
              <span>{networkStatus?.online ? "已连接" : "离线"}</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>网关</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="orange" className="!h-2 !w-2" circle />
              <span>-</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>IP地址</Table.Th>
          <Table.Td>
            <span>{networkStatus?.public_ip}</span>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>DNS服务器</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <span>{networkStatus?.dns_servers?.join(",")}</span>
            </div>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(NetworkTable);
