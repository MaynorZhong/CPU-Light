import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, FC, memo, useEffect } from "react";
import BoardTable from "../components/BoardTable";
import { useTauriCommand } from "@/hooks";
import { useSysStore } from "@/store";
import { useShallow } from "zustand/shallow";
import type { LogicBoardInfo } from "@/types";

type MotherboardProps = {
  children?: ReactNode;
};

const Motherboard: FC<MotherboardProps> = props => {
  const { children } = props;

  const { execute } = useTauriCommand("get_logicboard_info");

  const { setLogicBoardInfo } = useSysStore(
    useShallow(({ setLogicBoardInfo }) => ({ setLogicBoardInfo }))
  );

  useEffect(() => {
    execute().then(res => {
      console.log("Motherboard Info:", res);
      setLogicBoardInfo(res as LogicBoardInfo);
    });
  }, []);

  return (
    <div>
      <BoardTable />
    </div>
  );
};

const MotherboardMemoComponent = memo(Motherboard);

export const Route = createFileRoute("/motherboard")({
  component: MotherboardMemoComponent,
});

export default MotherboardMemoComponent;
