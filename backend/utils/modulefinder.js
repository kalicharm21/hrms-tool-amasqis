export const modulefinder = (route) => {
  const parts = route.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  return parts[1];
};
