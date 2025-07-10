import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes({
  ignoredRouteFiles: [
    "**/.*",
    "**/*.css",
    "**/*.ico",
    "**/.well-known/**",
    "**/node_modules/**",
  ],
}) satisfies RouteConfig;
