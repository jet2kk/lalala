import { EmbedBuilder } from "discord.js";

const safeUrl = t => t?.uri && /^https?:\/\//i.test(t.uri) ? t.uri : "https://discord.com/";

export const errorEmbed = s => new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${s}`);
export const infoEmbed = s => new EmbedBuilder().setColor(0x5865F2).setDescription(s);

// Jockie-style: compact playback message, no thumbnail, no progress bar, no buttons.
export function nowPlaying(_player, track) {
  const title = track?.title || "Unknown";
  const artist = track?.author || "Unknown";
  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setDescription(`🎵  Started playing [**${title}**](${safeUrl(track)}) by **${artist}**`);
}

export function queueEmbed(player) {
  const a = Array.from(player.queue || []);
  let s = player.queue.current ? `**Đang phát:** ${player.queue.current.title}\n\n` : "";
  s += a.length ? a.slice(0,20).map((t,i)=>`**${i+1}.** ${t.title} — ${t.author || "Unknown"}`).join("\n") : "Queue trống.";
  if (a.length > 20) s += `\n\n… và ${a.length-20} bài khác.`;
  return new EmbedBuilder().setColor(0x5865F2).setTitle("📜 QUEUE").setDescription(s);
}

export function helpEmbed(p) {
  return new EmbedBuilder().setColor(0x5865F2).setTitle("🎵 Music").setDescription([
    `${p}play <tên/link>`, `${p}pause / ${p}resume`, `${p}skip / ${p}previous`,
    `${p}stop`, `${p}np / ${p}queue`, `${p}volume 1-100`, `${p}seek 1:30`,
    `${p}loop off|track|queue`, `${p}shuffle`, `${p}remove <số>`, `${p}clear`,
    `${p}autoplay on|off`, `${p}ping / ${p}node`
  ].map(x=>`\`${x}\``).join("\n"));
}
