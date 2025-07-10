export { ErrorBoundary } from "./ErrorBoundary";
export { SimpleErrorBoundary } from "./SimpleErrorBoundary";

// 错误边界相关的类型
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export interface SimpleErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  showDetails?: boolean;
}
