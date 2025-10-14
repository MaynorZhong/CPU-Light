export function byteToKB(bytes: number): string {
  return (bytes / 1024).toFixed(1);
}

export function byteToMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export function byteToGB(bytes: number): string {
  return (bytes / 1024 ** 3).toFixed(1);
}
