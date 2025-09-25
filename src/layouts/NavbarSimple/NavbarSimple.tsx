import { useState } from "react";
import { Code, Group } from "@mantine/core";
import classes from "./NavbarSimple.module.css";

import { NavLink } from "react-router";

import Logo from "@/assets/app.svg?react";

import { NAV_CONFIG } from "@/constants";
import { ActionToggle } from "@/components/ActionToggle";

export function NavbarSimple() {
  const links = NAV_CONFIG.map(item => (
    <NavLink
      to={item.link}
      key={item.key}
      className={({ isActive }) => (isActive ? classes.active : classes.link)}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </NavLink>
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

      <div className={classes.footer}>
        <ActionToggle />
      </div>
    </nav>
  );
}
