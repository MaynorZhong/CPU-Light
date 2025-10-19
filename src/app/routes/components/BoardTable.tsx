import ViewCard from "@/components/ViewCard";
import { useSysStore } from "@/store";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";
import { useShallow } from "zustand/shallow";

type BoardTableProps = {
  children?: ReactNode;
};

const BoardTable: FC<BoardTableProps> = props => {
  const { children } = props;

  const { logicBoardInfo } = useSysStore(
    useShallow(({ logicBoardInfo }) => ({ logicBoardInfo }))
  );

  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="主板"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              机型标识
            </Table.Th>
            <Table.Td className="!text-left">
              {logicBoardInfo?.model_identifier || "-"}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">型号</Table.Th>
            <Table.Td className="!text-left">
              {logicBoardInfo?.logic_board_code || "-"}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              芯片型号
            </Table.Th>
            <Table.Td className="!text-left">
              {logicBoardInfo?.chip_type || "-"}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              硬件UUID
            </Table.Th>
            <Table.Td className="!text-left">
              {logicBoardInfo?.platform_uuid || "-"}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              总核心数
            </Table.Th>
            <Table.Td className="!text-left">
              {logicBoardInfo?.sp_extras?.["Total Number of Cores"] || "-"}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              系统加载操作程序版本
            </Table.Th>
            <Table.Td className="!text-left">
              {logicBoardInfo?.sp_extras?.["OS Loader Version"] || "-"}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th className="border-r-1 border-[#f8f9fa]">
              固件版本
            </Table.Th>
            <Table.Td className="!text-left">
              {logicBoardInfo?.firmware_version || "-"}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

export default memo(BoardTable);
