import { Outlet } from "@tanstack/react-router";
import { type ReactNode, FC, memo } from "react";

type EmptyLayoutProps = {
  children?: ReactNode;
};

const EmptyLayout: FC<EmptyLayoutProps> = props => {
  const { children } = props;
  return (
    <div className="h-screen w-full">
      <Outlet />
    </div>
  );
};

export default EmptyLayout;
