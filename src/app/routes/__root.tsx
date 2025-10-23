import "../App.css";

import { NavbarSimple } from "@/layouts/NavbarSimple/NavbarSimple";
import { MantineProvider } from "@mantine/core";
import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootContent = () => {
  const location = useLocation();
  //   const { showLayout } = useLayout();

  // 定义不需要导航栏的路由
  const noLayoutRoutes = ["/splashscreen"];
  const shouldShowLayout = !noLayoutRoutes.includes(location.pathname);
  return (
    <>
      <MantineProvider>
        {/* <Header /> */}
        {shouldShowLayout ? (
          <div className="flex h-screen w-full">
            <NavbarSimple />
            <div className="w-full overflow-y-auto px-[30px] py-[20px]">
              <Outlet />
            </div>
          </div>
        ) : (
          <div className="h-screen w-full">
            <Outlet />
          </div>
        )}
      </MantineProvider>
      <TanStackRouterDevtools />
    </>
  );
};

const RootLayout = () => {
  return (
    <>
      <RootContent />
      <TanStackRouterDevtools />
    </>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});

export default RootLayout;
