import { ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  showDetails?: boolean;
}

export const SimpleErrorBoundary: React.FC<Props> = ({
  children,
  fallbackMessage = "出现了一个错误",
  showDetails = false,
}) => {
  return (
    <ErrorBoundary
      fallback={error => (
        <div className="flex items-center justify-center min-h-32 bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-center">
            <div className="text-red-600 mb-2">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-1">
              {fallbackMessage}
            </h3>
            {showDetails && (
              <p className="text-sm text-red-600">{error.message}</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
