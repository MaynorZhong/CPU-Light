import ViewCard from "@/components/ViewCard";
import { useSysStore } from "@/store";
import { formatSecondsToDHMS } from "@/utils/format-time";
import { Badge, Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";
import { useShallow } from "zustand/shallow";

type BatteryDetailProps = {
  children?: ReactNode;
};

const BatteryDetail: FC<BatteryDetailProps> = props => {
  const { children } = props;
  const { batterieInfo } = useSysStore(
    useShallow(({ batterieInfo }) => ({
      batterieInfo,
    }))
  );

  const {
    model,
    serial_number,
    apple_raw_max_capacity,
    apple_raw_current_capacity,
    max_capacity,
    percentage,
    cycle_count,
    design_capacity,
    time_to_empty_seconds,
    voltage,
    temperature_c,
    state,
    time_to_full_seconds,
  } = batterieInfo?.batteries[0] || {};
  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="电池详情"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              电源管理集成电路（PMIC）芯片
            </Table.Th>
            <Table.Td className="!text-left">{model || "未知型号"}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">序列号</Table.Th>
            <Table.Td className="!text-left">{serial_number}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              电池最大容量(mAh)
            </Table.Th>
            <Table.Td className="!text-left">{apple_raw_max_capacity}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              当前容量(mAh)
            </Table.Th>
            <Table.Td className="!text-left">
              {apple_raw_current_capacity}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              最大容量百分比(%)
            </Table.Th>
            <Table.Td className="!text-left">{max_capacity}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              当前电池容量(%)
            </Table.Th>
            <Table.Td className="!text-left">{percentage}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              循环计数
            </Table.Th>
            <Table.Td className="!text-left">{cycle_count}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              设计容量(mAh)
            </Table.Th>
            <Table.Td className="!text-left">{design_capacity}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              预计剩余可用时间
            </Table.Th>
            <Table.Td className="!text-left">
              {formatSecondsToDHMS(time_to_empty_seconds || 0)}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              当前电压
            </Table.Th>
            <Table.Td className="!text-left">
              {voltage
                ? `${parseFloat(voltage as unknown as string) / 1000}V`
                : "-"}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              当前温度(°C)
            </Table.Th>
            <Table.Td className="!text-left">{temperature_c}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              充电状态
            </Table.Th>
            <Table.Td className="!text-left">
              <div className="flex items-center justify-start gap-2">
                <Badge
                  color={state === "Charging" ? "green" : "orange"}
                  className="!h-2 !w-2"
                  circle
                />
                <span>{state === "Charging" ? "充电中" : "未充电"}</span>
              </div>
            </Table.Td>
          </Table.Tr>

          {state === "Charging" && (
            <Table.Tr>
              <Table.Th className="border-r-1 border-[#f8f9fa]">
                预计充满时间
              </Table.Th>
              <Table.Td className="!text-left">
                {formatSecondsToDHMS(time_to_full_seconds || 0)}
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

export default memo(BatteryDetail);
