import { invoke } from "@tauri-apps/api/core";

export interface ErrorReport {
  message: string;
  stack?: string;
  name: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private isProcessing = false;
  private maxQueueSize = 100;
  private retryDelay = 5000;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private constructor() {
    this.setupGlobalErrorHandlers();
    this.setupPeriodicCleanup();
  }

  private setupGlobalErrorHandlers(): void {
    // 捕获未处理的JavaScript错误
    window.addEventListener("error", event => {
      this.handleError(
        event.error || new Error(event.message),
        "window.onerror"
      );
    });

    // 捕获未处理的Promise rejection
    window.addEventListener("unhandledrejection", event => {
      this.handleError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        "unhandledrejection"
      );
    });

    // 捕获资源加载错误
    window.addEventListener(
      "error",
      event => {
        if (event.target !== window) {
          this.handleError(
            new Error(
              `Resource loading error: ${(event.target as any)?.src || (event.target as any)?.href}`
            ),
            "resource-error"
          );
        }
      },
      true
    );
  }

  private setupPeriodicCleanup(): void {
    // 每小时清理一次错误队列
    setInterval(() => {
      if (this.errorQueue.length > this.maxQueueSize) {
        this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
      }
    }, 3600000);
  }

  async handleError(error: Error, context?: string): Promise<void> {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      buildVersion: import.meta.env.VITE_APP_VERSION || "unknown",
    };

    // 开发环境直接打印
    if (import.meta.env.DEV) {
      console.group(`🚨 Error Handler: ${context || "Unknown Context"}`);
      console.error("Error:", error);
      console.error("Error Report:", errorReport);
      console.groupEnd();
    }

    // 防止重复添加相同的错误
    const isDuplicate = this.errorQueue.some(
      existingError =>
        existingError.message === errorReport.message &&
        existingError.stack === errorReport.stack &&
        Date.now() - new Date(existingError.timestamp).getTime() < 10000 // 10秒内的重复错误
    );

    if (!isDuplicate) {
      this.errorQueue.push(errorReport);
      this.processErrorQueue();
    }
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.errorQueue.length > 0) {
        const error = this.errorQueue.shift()!;
        await this.sendErrorToBackend(error);
      }
    } catch (err) {
      console.error("Failed to process error queue:", err);
      // 延迟重试
      setTimeout(() => {
        this.processErrorQueue();
      }, this.retryDelay);
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendErrorToBackend(error: ErrorReport): Promise<void> {
    try {
      await invoke("log_error", { error });
    } catch (err) {
      console.error("Failed to send error to backend:", err);
      // 重新加入队列稍后重试，但避免无限重试
      if (this.errorQueue.length < this.maxQueueSize) {
        this.errorQueue.push(error);
      }
      throw err;
    }
  }

  // 手动清理错误队列
  clearErrorQueue(): void {
    this.errorQueue = [];
  }

  // 获取错误统计
  getErrorStats(): { totalErrors: number; queueLength: number } {
    return {
      totalErrors: this.errorQueue.length,
      queueLength: this.errorQueue.length,
    };
  }

  // 设置用户ID（用于错误追踪）
  setUserId(userId: string): void {
    this.errorQueue.forEach(error => {
      error.userId = userId;
    });
  }

  // 设置会话ID（用于错误追踪）
  setSessionId(sessionId: string): void {
    this.errorQueue.forEach(error => {
      error.sessionId = sessionId;
    });
  }
}

// 初始化全局错误处理器
export const errorHandler = ErrorHandler.getInstance();
