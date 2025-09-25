import ViewCard from "@/components/ViewCard";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";

type ClockTableProps = {
  children?: ReactNode;
};

const ClockTable: FC<ClockTableProps> = props => {
  const { children } = props;
  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="时钟频率"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              性能核心基础频率
            </Table.Th>
            <Table.Td className="!text-left">7.x migration</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              性能核心最大频率
            </Table.Th>
            <Table.Td className="!text-left">Open</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              效率核心基础频率
            </Table.Th>
            <Table.Td className="!text-left">135</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              效率核心最大频率
            </Table.Th>
            <Table.Td className="!text-left">874</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              总线频率
            </Table.Th>
            <Table.Td className="!text-left">芯片面积</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">倍率</Table.Th>
            <Table.Td className="!text-left">芯片面积</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

export default memo(ClockTable);
