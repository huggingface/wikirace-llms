export const isProd = import.meta.env.VITE_ENV === "production";
export const API_BASE = isProd ? "" : "http://localhost:8000"; // we want this blank in production

console.log("API_BASE", API_BASE);
