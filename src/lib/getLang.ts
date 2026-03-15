export function getLang() {
  if (typeof document === "undefined") return "en";

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("lang="));

  return cookie?.split("=")[1] || "en";
}