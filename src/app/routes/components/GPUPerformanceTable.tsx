import { RingProgress, Table } from "@mantine/core";
import React, { type ReactNode, FC, memo } from "react";

type GPUPerformanceTableProps = {
  children?: ReactNode;
};

const GPUPerformanceTable: FC<GPUPerformanceTableProps> = props => {
  const { children } = props;
  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <div className="w-full">
          <RingProgress
            sections={[{ value: 40, color: "blue" }]}
            label={
              <span className="pl-1 text-xs text-gray-400">使用率:40%</span>
            }
          />
        </div>

        <Table.Tr>
          <Table.Th>显存使用</Table.Th>
          <Table.Td>2.8 GB / 36 GB</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(GPUPerformanceTable);
