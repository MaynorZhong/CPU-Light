import ViewCard from "@/components/ViewCard";
import { useSysStore } from "@/store";
import type { CacheInfo } from "@/types";
import { byteToKB, byteToMB } from "@/utils/byte";
import { Table } from "@mantine/core";
import { IconChevronCompactDown } from "@tabler/icons-react";
import {
  type ReactNode,
  createContext,
  FC,
  Fragment,
  useContext,
  useState,
} from "react";

import { useShallow } from "zustand/shallow";

const CacheInfoContext = createContext<CacheInfo | null>(null);

const useCacheInfo = () => useContext(CacheInfoContext);

type CacheTableProps = {
  children?: ReactNode;
};

type CacheTableComponent = FC<CacheTableProps>;

const CacheTable: CacheTableComponent = props => {
  const { children, ...restProps } = props;

  const { cacheInfo } = useSysStore(
    useShallow(({ cacheInfo }) => ({ cacheInfo }))
  );

  return (
    <CacheInfoContext.Provider value={cacheInfo}>
      <div {...restProps} className="flex w-full flex-col gap-4">
        {children}
      </div>
    </CacheInfoContext.Provider>
  );
};

type PerfLevel = {
  l1d_bytes: number;
  l1i_bytes: number;
  l2_bytes: number;
};

const CacheTablePerflevel = () => {
  const cacheInfo = useCacheInfo();

  const perfLevels = (
    cacheInfo?.perflevel ? Object.values(cacheInfo.perflevel) : []
  ) as PerfLevel[];

  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="性能级别（核心簇）缓存"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          {perfLevels.length ? (
            perfLevels.map((item, index) => {
              return (
                <Fragment key={index}>
                  <Table.Tr>
                    <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
                      等级{index + 1}L1指令缓存(KB)
                    </Table.Th>
                    <Table.Td className="!text-left">
                      {byteToKB(item.l1d_bytes || 0)}
                    </Table.Td>
                  </Table.Tr>

                  <Table.Tr>
                    <Table.Th className="border-r-1 border-[#f8f9fa]">
                      等级{index + 1}L1 数据缓存(KB)
                    </Table.Th>
                    <Table.Td className="!text-left">
                      {byteToKB(item.l1i_bytes || 0)}
                    </Table.Td>
                  </Table.Tr>

                  <Table.Tr>
                    <Table.Th className="border-r-1 border-[#f8f9fa]">
                      等级{index + 1}L2 数据缓存(KB)
                    </Table.Th>
                    <Table.Td className="!text-left">
                      {byteToKB(item.l2_bytes || 0)}
                    </Table.Td>
                  </Table.Tr>
                </Fragment>
              );
            })
          ) : (
            <Table.Tr>
              <Table.Td className="!text-left">暂无数据</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

const CacheTableCPU = () => {
  const cacheInfo = useCacheInfo();
  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="CPU缓存"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              L1指令缓存(KB)
            </Table.Th>
            <Table.Td className="!text-left">
              {byteToKB(cacheInfo?.cache_l1d_bytes || 0)}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              L1数据缓存(KB)
            </Table.Th>
            <Table.Td className="!text-left">
              {byteToKB(cacheInfo?.cache_l1i_bytes || 0)}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              L2缓存(KB)
            </Table.Th>
            <Table.Td className="!text-left">
              {byteToKB(cacheInfo?.cache_l2_bytes || 0)}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              L2缓存(KB)
            </Table.Th>
            <Table.Td className="!text-left">
              {byteToKB(cacheInfo?.cache_l2_bytes || 0)}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              缓存行大小（字节）
            </Table.Th>
            <Table.Td className="!text-left">
              {cacheInfo?.cache_line_bytes || 0}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

const CacheInfoTableVM = () => {
  const cacheInfo = useCacheInfo();

  const { vm_cache } = cacheInfo || {};
  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="虚拟内存缓存"
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              文件页最小缓存(KB)
            </Table.Th>
            <Table.Td className="!text-left">
              {byteToKB(vm_cache?.page_filecache_min || 0)}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              Apple 保护页缓存上限(缓存条目数)
            </Table.Th>
            <Table.Td className="!text-left">
              {vm_cache?.apple_protect_pager_cache_limit || 0}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              受保护共享缓存页出数
            </Table.Th>
            <Table.Td className="!text-left">
              {vm_cache?.pageout_protected_sharedcache}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              强制回收共享缓存页数
            </Table.Th>
            <Table.Td className="!text-left">
              {vm_cache?.pageout_forcereclaimed_sharedcache}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              缓存行大小（字节）
            </Table.Th>
            <Table.Td className="!text-left">
              {cacheInfo?.cache_line_bytes || 0}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              系统页面大小（字节）
            </Table.Th>
            <Table.Td className="!text-left">
              {vm_cache?.pagesize_bytes || 0}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              活跃页 大小(MB)
            </Table.Th>
            <Table.Td className="!text-left">
              {byteToMB(vm_cache?.pages_active_bytes || 0)}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              空闲页大小(MB)
            </Table.Th>
            <Table.Td className="!text-left">
              {byteToMB(vm_cache?.pages_free_bytes || 0)}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160} className="border-r-1 border-[#f8f9fa]">
              不活跃大小(MB)
            </Table.Th>
            <Table.Td className="!text-left">
              {byteToMB(vm_cache?.pages_inactive_bytes || 0)}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

const CacheTableDebug = () => {
  const cacheInfo = useCacheInfo();

  const { debug_sysctls } = cacheInfo || {};

  const data = debug_sysctls ? Object.entries(debug_sysctls) : [];

  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <ViewCard
      col={1}
      gap={0}
      headerClass={{
        backgroundColor: "#015CE1",
        color: "#fff",
      }}
      title="Debug/Raw"
      isCollapsed={isCollapsed}
      extra={
        <div>
          <IconChevronCompactDown
            className={`cursor-pointer transition-transform ${
              isCollapsed ? "rotate-180" : "rotate-0"
            }`}
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
        </div>
      }
    >
      <Table variant="vertical" layout="fixed" withTableBorder>
        <Table.Tbody>
          {data.length &&
            data.map(([key, value]) => {
              return (
                <Table.Tr>
                  <Table.Th className="border-r-1 border-[#f8f9fa]">
                    <span>{key}</span>
                  </Table.Th>
                  <Table.Td className="!text-left">
                    <span>{value}</span>
                  </Table.Td>
                </Table.Tr>
              );
            })}
        </Table.Tbody>
      </Table>
    </ViewCard>
  );
};

export default Object.assign(CacheTable, {
  Perflevel: CacheTablePerflevel,
  CPU: CacheTableCPU,
  VM: CacheInfoTableVM,
  Debug: CacheTableDebug,
});
