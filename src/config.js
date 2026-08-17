import "dotenv/config";
const required = name => {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
};
const prefix = process.env.PREFIX?.trim() || "!";
if (prefix.length > 3) throw new Error("PREFIX must be 1-3 characters.");
export const config = {
  token: required("DISCORD_TOKEN"), prefix,
  port: Number(process.env.PORT || 3000),
  status: process.env.BOT_STATUS || "Music",
  lavalink: {
    host: required("LAVALINK_HOST"),
    port: Number(process.env.LAVALINK_PORT || 2333),
    password: required("LAVALINK_PASSWORD"),
    secure: String(process.env.LAVALINK_SECURE || "false").toLowerCase() === "true"
  }
};
