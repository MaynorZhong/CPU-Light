import { useState } from "react";
import { Code, Group } from "@mantine/core";
import classes from "./NavbarSimple.module.css";

import Logo from "@/assets/app.svg?react";

import { NAV_CONFIG } from "@/constants";

export function NavbarSimple() {
  const [active, setActive] = useState("Billing");

  const links = NAV_CONFIG.map(item => (
    <a
      className={classes.link}
      data-active={item.label === active || undefined}
      href={item.link}
      key={item.label}
      onClick={event => {
        event.preventDefault();
        setActive(item.label);
      }}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </a>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} justify="space-between">
          <div className="flex items-center gap-2">
            <Logo className="w-10" />
            <span className="font-semibold antialiased">CPU-L</span>
          </div>
          <Code fw={700}>v3.1.2</Code>
        </Group>
        {links}
      </div>

      <div className={classes.footer}></div>
    </nav>
  );
}
