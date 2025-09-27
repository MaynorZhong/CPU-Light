import { useSysStore } from "@/store";
import { formatSecondsToDHMS } from "@/utils/format-time";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";
import { useShallow } from "zustand/shallow";

type EquipmentTableProps = {
  children?: ReactNode;
};

const EquipmentTable: FC<EquipmentTableProps> = props => {
  const { children } = props;
  const { deviceInfo, hardwareInfo } = useSysStore(
    useShallow(({ deviceInfo, hardwareInfo }) => ({
      deviceInfo,
      hardwareInfo,
    }))
  );
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>设备信息</Table.Th>
          <Table.Td>{`${hardwareInfo?.model_name}(${hardwareInfo?.chip})`}</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>设备标识符</Table.Th>
          <Table.Td>{deviceInfo?.model_identifier}</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>序列号</Table.Th>
          <Table.Td>{deviceInfo?.serial_number}</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>运行时间</Table.Th>
          <Table.Td>
            {deviceInfo?.uptime_seconds &&
              formatSecondsToDHMS(deviceInfo!.uptime_seconds!)}
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(EquipmentTable);
