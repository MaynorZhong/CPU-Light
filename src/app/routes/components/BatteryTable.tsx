import { Badge, Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";
import { Progress } from "@mantine/core";
import { useSysStore } from "@/store";
import { useShallow } from "zustand/shallow";

type BatteryTableProps = {
  children?: ReactNode;
};

const BatteryTable: FC<BatteryTableProps> = props => {
  const { children } = props;

  const { batterieInfo } = useSysStore(
    useShallow(({ batterieInfo }) => ({
      batterieInfo,
    }))
  );

  const { percentage, state, cycle_count, temperature_c, voltage } =
    batterieInfo?.batteries[0] || {};

  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>电池电量</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="green" className="!h-2 !w-2" circle />
              <span>{`${percentage || "-"}%`}</span>
            </div>
            <Progress
              value={parseInt(percentage!) || 0}
              size="lg"
              className="mt-1"
            />
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>充电状态</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge
                color={state === "Charging" ? "green" : "orange"}
                className="!h-2 !w-2"
                circle
              />
              <span>{state === "Charging" ? "充电中" : "未充电"}</span>
            </div>
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>电池温度</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="yellow" className="!h-2 !w-2" circle />
              <span>
                {temperature_c
                  ? `${parseFloat(temperature_c).toFixed(1)}°C`
                  : "-"}
              </span>
            </div>
          </Table.Td>
        </Table.Tr>

        {/* <Table.Tr>
          <Table.Th>当前电压</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge color="yellow" className="!h-2 !w-2" circle />
              <span>{voltage ? `${parseFloat(voltage) * 1000}mV` : "-"}</span>
            </div>
          </Table.Td>
        </Table.Tr> */}

        <Table.Tr>
          <Table.Th>循环计数</Table.Th>
          <Table.Td>
            <div className="flex items-center justify-end gap-2">
              <Badge
                color={cycle_count! <= 300 ? "green" : "orange"}
                className="!h-2 !w-2"
                circle
              />
              <span>{cycle_count}</span>
            </div>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(BatteryTable);
