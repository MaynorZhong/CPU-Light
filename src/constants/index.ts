import type { Icon, IconProps } from "@tabler/icons-react";

import {
  IconWorldCog,
  IconCpu,
  IconBrandDatabricks,
  IconFingerprint,
  IconDeviceSdCard,
  IconArtboard,
} from "@tabler/icons-react";

type NavConfig = {
  link: string;
  label: string;
  icon:
    | React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>
    | string;
};

const NAV_CONFIG = [
  {
    label: "系统概览",
    link: "/",
    icon: IconWorldCog,
  },
  {
    label: "处理器",
    link: "/cpu",
    icon: IconCpu,
  },
  {
    label: "缓存",
    link: "/cache",
    icon: IconBrandDatabricks,
  },
  {
    label: "主板",
    link: "/motherboard",
    icon: IconFingerprint,
  },
  {
    label: "内存",
    link: "/memory",
    icon: IconDeviceSdCard,
  },
  {
    label: "显卡",
    link: "/gpu",
    icon: IconArtboard,
  },
] as NavConfig[];

export { NAV_CONFIG };
