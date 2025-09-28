/**
 * 安全地从对象中获取扁平化的key对应的值
 * @param obj 对象
 * @param path 扁平化的key路径，支持点分隔符
 * @param defaultValue 默认值
 * @returns 对应的值或默认值
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function pick<T = unknown, D = unknown>(
  obj: unknown,
  path: string | string[],
  defaultValue?: D
): T | D | undefined {
  if (obj == null) return defaultValue;

  // 如果是字符串并且该对象存在该扁平键
  if (
    typeof path === "string" &&
    isRecord(obj) &&
    Object.prototype.hasOwnProperty.call(obj, path)
  ) {
    return obj[path] as T;
  }

  let cur: unknown = obj;

  const segments = Array.isArray(path) ? path : path.split(".");

  for (const seg of segments) {
    if (isRecord(cur) && Object.prototype.hasOwnProperty.call(cur, seg)) {
      cur = cur[seg];
    } else {
      return defaultValue;
    }
  }

  return cur as T;
}
