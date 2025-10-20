import { useSysStore } from "@/store";
import { Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";
import { useShallow } from "zustand/shallow";

type DisplayTableProps = {
  children?: ReactNode;
};

const DisplayTable: FC<DisplayTableProps> = props => {
  const { children } = props;

  const { gpuInfo } = useSysStore(useShallow(({ gpuInfo }) => ({ gpuInfo })));
  const { displays } = gpuInfo || {};
  return (
    <div className="flex flex-wrap items-center">
      {displays?.map(display => {
        return (
          <Table variant="vertical" layout="fixed" key={display.name}>
            <Table.Tbody>
              <Table.Tr>
                <Table.Th>显示器</Table.Th>
                <Table.Td>{display.name || "-"}</Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Th>分辨率</Table.Th>
                <Table.Td>{display.resolution}</Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Th>内置屏幕</Table.Th>
                <Table.Td>{display.isBuiltin ? "是" : "否"}</Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Th>连接类型</Table.Th>
                <Table.Td>{display.connectionType}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        );
      })}
    </div>
  );
};

export default memo(DisplayTable);
