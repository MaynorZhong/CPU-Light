import type { Icon, IconProps } from "@tabler/icons-react";

import {
  IconWorldCog,
  IconCpu,
  IconBrandDatabricks,
  IconFingerprint,
  IconDeviceSdCard,
  IconArtboard,
  IconBattery3Filled,
} from "@tabler/icons-react";

type NavConfig = {
  link: string;
  label: string;
  key: string;
  icon:
    | React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>
    | string;
};

const NAV_CONFIG = [
  {
    label: "系统概览",
    key: "home",
    link: "/",
    icon: IconWorldCog,
  },
  {
    label: "电池",
    key: "battery",
    link: "/battery",
    icon: IconBattery3Filled,
  },
  {
    label: "处理器",
    key: "cpu",
    link: "/cpu",
    icon: IconCpu,
  },
  {
    label: "缓存",
    key: "cache",
    link: "/cache",
    icon: IconBrandDatabricks,
  },
  {
    label: "主板",
    key: "motherboard",
    link: "/motherboard",
    icon: IconFingerprint,
  },
  {
    label: "内存",
    key: "memory",
    link: "/memory",
    icon: IconDeviceSdCard,
  },
  {
    label: "显卡",
    key: "gpu",
    link: "/gpu",
    icon: IconArtboard,
  },
] as NavConfig[];

export { NAV_CONFIG };
