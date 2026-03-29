export const formatViewers = (value: number): string => {
  if (value >= 1000) return (value / 1000).toFixed(1) + "k";
  return value.toString();
};
