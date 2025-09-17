import ViewCard from "@/components/ViewCard";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";

type PowerConsumptionTableProps = {
  children?: ReactNode;
};

const PowerConsumptionTable: FC<PowerConsumptionTableProps> = props => {
  const { children } = props;
  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="温度与功耗"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              <div>
                <span>温度</span>
              </div>
            </Table.Th>
            <Table.Td className="!text-left">7.x migration</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              最高温度
            </Table.Th>
            <Table.Td className="!text-left">Open</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">TDP</Table.Th>
            <Table.Td className="!text-left">135</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              最大功耗
            </Table.Th>
            <Table.Td className="!text-left">SMT</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              当前功耗
            </Table.Th>
            <Table.Td className="!text-left">SMT</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

export default memo(PowerConsumptionTable);
