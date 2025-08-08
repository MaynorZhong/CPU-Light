# 🛡️ 错误边界组件文档

## 📋 概述

错误边界是React组件，可以捕获JavaScript错误并显示备用UI，而不是让整个应用崩溃。

## 🚀 功能特性

### ✅ **ErrorBoundary**

- 完整的错误捕获和处理
- 自动错误日志记录到后端
- 可自定义的错误UI
- 错误重试和重置功能
- 开发模式下的详细错误信息
- 错误复制到剪贴板功能

### ✅ **SimpleErrorBoundary**

- 轻量级错误边界
- 简洁的错误提示
- 快速集成

### ✅ **ErrorHandler**

- 全局错误处理器
- 自动错误队列管理
- 防重复错误机制
- 后端错误日志记录

## 📖 使用方法

### 基础用法

```tsx
import { ErrorBoundary } from "@components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### 自定义错误处理

```tsx
import { ErrorBoundary } from "@components/ErrorBoundary";
import { errorHandler } from "@utils/errorHandler";

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        errorHandler.handleError(error, "App Component");
        // 自定义错误处理逻辑
      }}
      fallback={(error, errorInfo) => <div>自定义错误UI</div>}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### 简化版本

```tsx
import { SimpleErrorBoundary } from "@components/ErrorBoundary";

function Component() {
  return (
    <SimpleErrorBoundary fallbackMessage="组件加载失败" showDetails={true}>
      <YourComponent />
    </SimpleErrorBoundary>
  );
}
```

### 错误重置

```tsx
import { ErrorBoundary } from "@components/ErrorBoundary";

function App() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <ErrorBoundary resetKeys={[resetKey]} resetOnPropsChange={true}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

## 🔧 配置选项

### ErrorBoundary Props

| 属性                 | 类型      | 默认值 | 说明             |
| -------------------- | --------- | ------ | ---------------- |
| `children`           | ReactNode | -      | 子组件           |
| `fallback`           | Function  | -      | 自定义错误UI函数 |
| `onError`            | Function  | -      | 错误处理回调     |
| `resetOnPropsChange` | boolean   | false  | 属性变化时重置   |
| `resetKeys`          | Array     | -      | 重置触发键       |

### SimpleErrorBoundary Props

| 属性              | 类型      | 默认值           | 说明         |
| ----------------- | --------- | ---------------- | ------------ |
| `children`        | ReactNode | -                | 子组件       |
| `fallbackMessage` | string    | "出现了一个错误" | 错误提示信息 |
| `showDetails`     | boolean   | false            | 显示错误详情 |

## 🏗️ 后端集成

### Rust端错误日志

在 `src-tauri/src/lib.rs` 中已集成错误日志处理：

```rust
#[tauri::command]
fn log_error(error: ErrorReport) -> Result<(), String> {
    log::error!("Frontend Error: {}", error.message);
    // 错误处理逻辑
    Ok(())
}
```

### 错误数据结构

```typescript
interface ErrorReport {
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
```

## 🧪 测试

项目包含了错误边界演示组件，可以测试：

1. 启动应用：`pnpm tauri:dev`
2. 点击"测试错误边界"按钮
3. 观察错误处理效果

## 🛠️ 最佳实践

### 1. 分层错误边界

```tsx
function App() {
  return (
    <ErrorBoundary>
      {" "}
      {/* 全局错误边界 */}
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                {" "}
                {/* 页面级错误边界 */}
                <HomePage />
              </ErrorBoundary>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### 2. 错误分类处理

```tsx
const handleError = (error: Error, context: string) => {
  if (error.name === "ChunkLoadError") {
    // 处理代码分割加载错误
    window.location.reload();
  } else if (error.name === "NetworkError") {
    // 处理网络错误
    showNetworkErrorToast();
  } else {
    // 处理其他错误
    errorHandler.handleError(error, context);
  }
};
```

### 3. 用户友好的错误信息

```tsx
const getErrorMessage = (error: Error) => {
  const errorMessages = {
    ChunkLoadError: "应用更新了，请刷新页面",
    NetworkError: "网络连接异常，请检查网络",
    TypeError: "数据格式错误，请重试",
  };

  return errorMessages[error.name] || "出现了意外错误";
};
```

## 🔍 调试

### 开发模式

- 错误边界会显示详细的错误信息
- 控制台会输出完整的错误堆栈
- 可以复制错误信息进行调试

### 生产模式

- 显示用户友好的错误信息
- 错误自动发送到后端日志
- 提供重试和重新加载选项

## 🚨 注意事项

1. 错误边界只能捕获组件树中的JavaScript错误
2. 不能捕获事件处理器中的错误
3. 不能捕获异步代码中的错误
4. 不能捕获服务端渲染的错误
5. 不能捕获错误边界自身的错误

对于这些情况，请使用 `errorHandler.handleError()` 手动处理。
