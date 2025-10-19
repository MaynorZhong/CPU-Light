import ViewCard from "@/components/ViewCard";
import { IconBrandOnedrive, IconDatabase } from "@tabler/icons-react";
import React, { type ReactNode, FC, memo, useEffect } from "react";

import MemoryTable from "./components/MemoryTable";
import VirtualMemoryTable from "./components/VirtualMemoryTable";
import { Table } from "@mantine/core";
import { useTauriCommand } from "@/hooks";
import { useSysStore } from "@/store";
import { useShallow } from "zustand/shallow";
import type { MemoryInfoType, MemoryModuleInfo } from "@/types";
import { byteToGB, byteToMB } from "@/utils/byte";

type MemoryProps = {
  children: ReactNode;
};

const Memory: FC<MemoryProps> = props => {
  const { children } = props;

  const { execute } = useTauriCommand("get_memory_info");

  const { execute: getMemoryInfoModules } =
    useTauriCommand("get_memory_modules");

  const { setMemoryInfo, setMemoryModules, memoryModules, memoryInfo } =
    useSysStore(
      useShallow(
        ({ setMemoryInfo, setMemoryModules, memoryModules, memoryInfo }) => ({
          setMemoryInfo,
          setMemoryModules,
          memoryModules,
          memoryInfo,
        })
      )
    );

  useEffect(() => {
    execute().then(res => {
      console.log("Memory Info:", res);
      setMemoryInfo(res as MemoryInfoType);
    });

    getMemoryInfoModules().then(res => {
      console.log("Memory Modules Info:", res);
      setMemoryModules(res as MemoryModuleInfo[]);
    });
  }, []);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="mt-6 flex w-full flex-wrap gap-[16px]">
        <ViewCard col={2} title="内存信息" icon={<IconDatabase size={16} />}>
          <MemoryTable />
        </ViewCard>
        <ViewCard
          col={2}
          title="压缩与虚拟内存"
          icon={<IconBrandOnedrive size={16} />}
        >
          <VirtualMemoryTable />
        </ViewCard>
        <ViewCard col={2} title="交换分区(Swap)">
          <VirtualMemoryTable.Swap />
        </ViewCard>
      </div>
      <ViewCard
        col={1}
        gap={0}
        headerClass={{
          backgroundColor: "#015CE1",
          color: "#fff",
        }}
        title="内存插槽信息"
      >
        <Table variant="vertical" layout="fixed" withTableBorder>
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
                内存类型
              </Table.Th>
              <Table.Td className="!text-left">
                {memoryModules &&
                  `${memoryModules[0]?.mem_type}-${memoryModules[0]!.slot}`}
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th className="border-r-1 border-[#f8f9fa]">
                总容量
              </Table.Th>
              <Table.Td className="!text-left">
                {(memoryModules && memoryModules[0]?.size_readable) || "-"}
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th className="border-r-1 border-[#f8f9fa]">
                供应商
              </Table.Th>
              <Table.Td className="!text-left">
                {(memoryModules && memoryModules[0]?.manufacturer) || "-"}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </ViewCard>

      <ViewCard
        col={1}
        gap={0}
        headerClass={{
          backgroundColor: "#015CE1",
          color: "#fff",
        }}
        title="内存分区信息"
      >
        <Table variant="vertical" layout="fixed" withTableBorder>
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
                活跃页
              </Table.Th>
              <Table.Td className="!text-left">
                {memoryInfo?.pages_active_bytes
                  ? byteToGB(memoryInfo?.pages_active_bytes) + "GB"
                  : "-"}
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th className="border-r-1 border-[#f8f9fa]">
                非活跃页
              </Table.Th>
              <Table.Td className="!text-left">
                {memoryInfo?.pages_inactive_bytes
                  ? byteToGB(memoryInfo?.pages_inactive_bytes) + "GB"
                  : "-"}
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th className="border-r-1 border-[#f8f9fa]">
                固定页（wired）
              </Table.Th>
              <Table.Td className="!text-left">
                {memoryInfo?.pages_wired_bytes
                  ? byteToGB(memoryInfo?.pages_wired_bytes) + "GB"
                  : "-"}
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th className="border-r-1 border-[#f8f9fa]">
                可清除页
              </Table.Th>
              <Table.Td className="!text-left">
                {memoryInfo?.pages_purgeable_bytes
                  ? byteToMB(memoryInfo?.pages_purgeable_bytes) + "MB"
                  : "-"}
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th className="border-r-1 border-[#f8f9fa]">
                推测页
              </Table.Th>
              <Table.Td className="!text-left">
                {memoryInfo?.pages_speculative_bytes
                  ? byteToMB(memoryInfo?.pages_speculative_bytes) + "MB"
                  : "-"}
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th className="border-r-1 border-[#f8f9fa]">
                空闲页
              </Table.Th>
              <Table.Td className="!text-left">
                {memoryInfo?.pages_free_bytes
                  ? byteToMB(memoryInfo?.pages_free_bytes) + "MB"
                  : "-"}
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th className="border-r-1 border-[#f8f9fa]">
                页面大小(字节)
              </Table.Th>
              <Table.Td className="!text-left">
                {memoryInfo?.pagesize_bytes ? memoryInfo?.pagesize_bytes : "-"}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </ViewCard>
      <ViewCard
        col={1}
        gap={0}
        headerClass={{
          backgroundColor: "#015CE1",
          color: "#fff",
        }}
        title="内存页交换统计"
      >
        <Table variant="vertical" layout="fixed" withTableBorder>
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
                页面调入
              </Table.Th>
              <Table.Td className="!text-left">
                {memoryInfo?.pageins ? memoryInfo?.pageins : "-"}
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th className="border-r-1 border-[#f8f9fa]">
                页面调出
              </Table.Th>
              <Table.Td className="!text-left">
                {memoryInfo?.pageouts ? memoryInfo?.pageouts : "-"}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </ViewCard>
    </div>
  );
};

export default memo(Memory);
