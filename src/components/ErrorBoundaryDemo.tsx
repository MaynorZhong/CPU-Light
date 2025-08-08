import { useState } from "react";
import { SimpleErrorBoundary } from "@components/ErrorBoundary";

// 一个会故意抛错的组件
const BuggyComponent: React.FC<{ shouldThrow: boolean }> = ({
  shouldThrow,
}) => {
  if (shouldThrow) {
    throw new Error("这是一个测试错误！");
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
      <p className="text-green-800">这个组件工作正常！</p>
    </div>
  );
};

export const ErrorBoundaryDemo: React.FC = () => {
  const [showBuggyComponent, setShowBuggyComponent] = useState(false);
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">错误边界演示</h2>

        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => setShowBuggyComponent(!showBuggyComponent)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showBuggyComponent ? "隐藏" : "显示"}组件
            </button>

            <button
              onClick={() => setShouldThrow(!shouldThrow)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {shouldThrow ? "修复" : "触发"}错误
            </button>
          </div>

          {showBuggyComponent && (
            <SimpleErrorBoundary
              fallbackMessage="组件出错了"
              showDetails={true}
            >
              <BuggyComponent shouldThrow={shouldThrow} />
            </SimpleErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
};
