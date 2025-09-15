import React, { type ReactNode, FC, memo, useMemo } from "react";
import { ActionIcon, Card, Flex, Menu } from "@mantine/core";
import { motion } from "motion/react";

type ViewCardProps = {
  children?: ReactNode;
  extra?: ReactNode;
  width?: string | number;
  height?: string | number;
  col?: number;
  gap?: number;
  title?: string;
  icon?: ReactNode;
};

const ViewCard: FC<ViewCardProps> = props => {
  const {
    children,
    extra,
    width,
    height,
    col = 2,
    gap = 16,
    icon,
    title = "",
  } = props;

  const calcWidth = useMemo(() => {
    if (width) {
      return typeof width === "number" ? `${width}px` : width;
    }
    return gap ? `calc((100% - ${(col - 1) * gap}px) / ${col})` : "100%";
  }, [col, gap, width]);

  return (
    <motion.div
      style={{
        width: calcWidth,
        height: height
          ? typeof height === "number"
            ? `${height}px`
            : height
          : "auto",
      }}
      whileHover={{
        scale: 1.01,
        translateY: -3,
        transition: { duration: 0.5 },
        boxShadow: "0 8px 32px 0 rgba(0, 122, 255, 0.15)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="cursor-pointer"
    >
      <Card
        shadow="sm"
        radius="md"
        withBorder
        className="h-full w-full !border-1 !border-[#f0f0f0] shadow-xl"
        style={{
          "box-shadow": "0 4px 20px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Card.Section inheritPadding py="xs">
          <Flex justify="space-between">
            <div className="flex w-full gap-2 antialiased">
              <div className="flex h-[24px] w-[24px] items-center justify-center rounded-sm bg-linear-135 from-[#007aff] to-[#5ac8fa] text-white">
                {icon ?? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="icon icon-tabler icons-tabler-filled icon-tabler-device-imac"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M8 22a1 1 0 0 1 0 -2h.616l.25 -2h-4.866a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-4.867l.25 2h.617a1 1 0 0 1 0 2zm5.116 -4h-2.233l-.25 2h2.733z" />
                  </svg>
                )}
              </div>
              <span className="text-[16px] font-semibold">{title}</span>
            </div>

            <div className="h-full">{extra}</div>
          </Flex>
        </Card.Section>
        <Card.Section mt="sm">
          <div>{children}</div>
        </Card.Section>
      </Card>
    </motion.div>
  );
};

export default memo(ViewCard);
