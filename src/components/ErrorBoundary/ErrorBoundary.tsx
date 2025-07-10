import { Component, ErrorInfo, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo,
    });

    // 调用父组件的错误处理函数
    this.props.onError?.(error, errorInfo);

    // 记录错误到后端
    this.logErrorToBackend(error, errorInfo).catch(logError => {
      console.error("Failed to log error to backend:", logError);
    });

    // 在开发环境中打印详细错误信息
    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Error Boundary Caught An Error");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }
  }

  public override componentDidUpdate(prevProps: Props): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // 如果有错误并且设置了重置条件
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary();
      } else if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => prevProps.resetKeys?.[index] !== key
        );
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  private logErrorToBackend = async (
    error: Error,
    errorInfo: ErrorInfo
  ): Promise<void> => {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId,
      };

      await invoke("log_error", { error: errorReport });
    } catch (err) {
      console.error("Failed to log error to backend:", err);
    }
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReset = (): void => {
    this.resetErrorBoundary();
  };

  private copyErrorToClipboard = async (): Promise<void> => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorText = `
错误信息: ${this.state.error.message}
错误名称: ${this.state.error.name}
发生时间: ${new Date().toLocaleString()}
错误ID: ${this.state.errorId}

堆栈信息:
${this.state.error.stack}

组件堆栈:
${this.state.errorInfo.componentStack}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      // 可以添加一个toast提示
    } catch (err) {
      console.error("Failed to copy error to clipboard:", err);
    }
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义fallback组件
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }

      // 默认错误UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-500"
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
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  出现了一个错误
                </h3>
                <p className="text-sm text-gray-500">应用程序遇到了意外错误</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-md p-4 mb-4">
              <div className="text-sm font-medium text-gray-900 mb-2">
                错误信息：
              </div>
              <div className="text-sm text-gray-700 break-all">
                {this.state.error?.message}
              </div>
              {this.state.errorId && (
                <div className="text-xs text-gray-500 mt-2">
                  错误ID: {this.state.errorId}
                </div>
              )}
            </div>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details className="mb-4">
                <summary className="text-sm font-medium text-gray-900 cursor-pointer hover:text-gray-700">
                  详细信息 (开发模式)
                </summary>
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>堆栈信息:</strong>
                    <pre className="whitespace-pre-wrap">
                      {this.state.error?.stack}
                    </pre>
                  </div>
                  <div>
                    <strong>组件堆栈:</strong>
                    <pre className="whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            <div className="flex space-x-3 mb-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                重试
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                重新加载
              </button>
            </div>

            <button
              onClick={this.copyErrorToClipboard}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              复制错误信息
            </button>

            <div className="mt-4 text-xs text-gray-500 text-center">
              如果问题持续存在，请联系技术支持
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
