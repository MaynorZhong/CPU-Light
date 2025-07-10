import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

function Root() {
  return (
    <html lang="zh-CN">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default Root;
