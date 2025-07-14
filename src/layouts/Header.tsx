import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconX,
} from "@tabler/icons-react";

import { type ReactNode, FC, memo } from "react";
import { useTauriWindow } from "@/hooks";

type HeaderProps = {
  children?: ReactNode;
};

const Header: FC<HeaderProps> = () => {
  const currentWindow = useTauriWindow();

  const windowControlsBtn = [
    {
      icon: (
        <IconX className="w-[70%] opacity-0 transition-opacity group-hover:opacity-100" />
      ),
      action: async () => {
        currentWindow.hide();
      },
      label: "Close",
      bgColor: "#ff5f57",
    },
    {
      icon: (
        <IconArrowsMinimize className="w-[70%] opacity-0 transition-opacity group-hover:opacity-100" />
      ),
      action: () => {
        console.log("Minimize or Unmaximize", currentWindow.isMaximized);
        currentWindow.isMaximized
          ? currentWindow.unmaximize()
          : currentWindow.minimize();
      },
      label: "Minimize",
      bgColor: "#ffbd2e",
    },
    {
      icon: (
        <IconArrowsMaximize className="w-[70%] opacity-0 transition-opacity group-hover:opacity-100" />
      ),
      action: () => {
        currentWindow.maximize();
      },
      label: "Maximize",
      bgColor: "#28ca42",
    },
  ];

  return (
    <div
      data-tauri-drag-region
      className="z-50 flex h-10 w-full items-center justify-between border-b-1 border-[var(--border-color)] bg-[var(--bg-color)] px-4 text-[var(--text-secondary)] backdrop-blur-2xl select-none"
    >
      <div className="flex items-center gap-2">
        {windowControlsBtn.map(item => {
          return (
            <button
              className="group flex h-[14px] w-[14px] cursor-pointer items-center justify-center rounded-full border-0 text-[8px] text-white duration-150 ease-out hover:scale-110 hover:transform-gpu"
              style={{ backgroundColor: item.bgColor }}
              key={item.label}
              onClick={item.action}
            >
              {item.icon}
            </button>
          );
        })}
      </div>
      <span>CPU-Light</span>
      <div className="invisible flex items-center gap-2">
        {windowControlsBtn.map(item => {
          return (
            <button
              className="group flex h-[14px] w-[14px] cursor-pointer items-center justify-center rounded-full border-0 text-[8px] text-white duration-150 ease-out hover:scale-110 hover:transform-gpu"
              style={{ backgroundColor: item.bgColor }}
              key={item.label}
              onClick={item.action}
            >
              {item.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(Header);
