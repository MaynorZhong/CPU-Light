import ViewCard from "@/components/ViewCard";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";

type CpuTableProps = {
  children?: ReactNode;
};

const CpuTable: FC<CpuTableProps> = props => {
  const { children } = props;
  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="处理器"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              名称
            </Table.Th>
            <Table.Td className="!text-left">7.x migration</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">代号</Table.Th>
            <Table.Td className="!text-left">Open</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              制程工艺
            </Table.Th>
            <Table.Td className="!text-left">135</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">封装</Table.Th>
            <Table.Td className="!text-left">874</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              晶体管数量
            </Table.Th>
            <Table.Td className="!text-left">芯片面积</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

export default memo(CpuTable);
