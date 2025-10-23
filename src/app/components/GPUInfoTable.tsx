import { useSysStore } from "@/store";

import { Table } from "@mantine/core";
import { type ReactNode, FC, memo } from "react";
import { useShallow } from "zustand/shallow";

type GPUInfoTableProps = {
  children?: ReactNode;
};

const GPUInfoTable: FC<GPUInfoTableProps> = props => {
  const { children } = props;

  const { gpuInfo } = useSysStore(useShallow(({ gpuInfo }) => ({ gpuInfo })));

  const { adapters } = gpuInfo || {};

  return (
    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>GPU型号</Table.Th>
          <Table.Td>
            {adapters?.length && adapters[0]?.model ? adapters[0]?.model : "-"}
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>GPU核心</Table.Th>
          <Table.Td>
            {adapters?.length && adapters[0]?.totalCores
              ? adapters[0].totalCores
              : "-"}
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>供应商</Table.Th>
          <Table.Td>
            {adapters?.length && adapters[0]?.vendor ? adapters[0].vendor : "-"}
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th>Metal支持</Table.Th>
          <Table.Td>
            {adapters?.length && adapters[0]?.metalFamily
              ? adapters[0].metalFamily
              : "-"}
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};

export default memo(GPUInfoTable);
