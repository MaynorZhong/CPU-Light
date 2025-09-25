export const formatSecindsToDHMS = (seconds: number): string => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  let result = "";
  if (d > 0) result += `${d}天`;
  if (h > 0) result += `${h}小时`;
  if (m > 0) result += `${m}分钟`;
  return result || "0天0小时0分钟";
};
