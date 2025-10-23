import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import AppIcon from "@/assets/app.svg?react";
import { Progress } from "@mantine/core";

export const Route = createFileRoute("/splashscreen")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigation = useNavigate({ from: "/" });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 3000; // 3秒
    const interval = 50; // 每50ms更新一次
    const increment = (100 / duration) * interval; // 每次增加的百分比

    const timer = setInterval(() => {
      setProgress(prev => {
        const nextProgress = prev + increment;

        if (nextProgress >= 100) {
          clearInterval(timer);
          // 进度达到100%后跳转
          setTimeout(() => {
            navigation({ to: "/" });
          }, 100); // 稍微延迟让用户看到100%
          return 100;
        }

        return nextProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [navigation]);

  return (
    <div className="h-screen w-full overflow-hidden">
      <div className="mt-24 flex justify-center">
        <div className="flex flex-col justify-center gap-8 p-8">
          <AppIcon className="h-48 w-48" />
          <Progress
            value={progress}
            size="lg"
            color="violet"
            transitionDuration={200}
          />
        </div>
      </div>
    </div>
  );
}

export default RouteComponent;
