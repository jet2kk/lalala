import "dotenv/config";
import express from "express";
import { Client, GatewayIntentBits, Partials, ActivityType } from "discord.js";
import { config } from "./config.js";
import { createMusic } from "./music.js";
import { controls, nowPlaying, queueEmbed, errorEmbed, infoEmbed, helpEmbed } from "./ui.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});
const music = createMusic(client);
const app = express();
app.get("/", (_q,r)=>r.status(200).send("Discord Music Bot OK"));
app.get("/health", (_q,r)=>{const nodes=[...music.shoukaku.nodes.values()];r.status(200).json({ok:true,discord:client.isReady(),lavalink:nodes.some(n=>n.state===2),nodes:nodes.map(n=>({name:n.name,state:n.state}))});});
app.listen(config.port,"0.0.0.0",()=>console.log(`[HTTP] ${config.port}`));

const temp = async (msg,payload,ms=4000)=>{const x=await msg.reply(payload).catch(()=>null);if(x)setTimeout(()=>x.delete().catch(()=>{}),ms);return x;};
const sameVoice=(msg,p)=>Boolean(msg.member?.voice?.channelId&&p?.voiceId===msg.member.voice.channelId);
const parseTime=s=>{if(!s)return null;const p=s.split(":").map(Number);if(p.some(Number.isNaN)||p.length>3)return null;if(p.length===1)return p[0];if(p.length===2)return p[0]*60+p[1];return p[0]*3600+p[1]*60+p[2];};

async function updateNP(player,track=player.queue.current){
  if(!track)return;
  const channel=await client.channels.fetch(player.textId).catch(()=>null);
  if(!channel?.isTextBased())return;
  await channel.send({embeds:[nowPlaying(player,track)]}).catch(()=>{});
}
async function getPlayer(msg){const p=music.getPlayer(msg.guild.id);if(!p)return temp(msg,{embeds:[errorEmbed("Chưa có player. Dùng play trước.")]})&&null;if(!sameVoice(msg,p))return temp(msg,{embeds:[errorEmbed("Bạn phải ở cùng voice channel với bot.")]})&&null;return p;}

async function onCommand(msg){
  if(!msg.guild||msg.author.bot||!msg.content.startsWith(config.prefix))return;
  const a=msg.content.slice(config.prefix.length).trim().split(/\s+/),cmd=(a.shift()||"").toLowerCase(),arg=a.join(" ").trim();
  try{
    if(cmd==="help"||cmd==="h")return temp(msg,{embeds:[helpEmbed(config.prefix)]},10000);
    if(cmd==="play"||cmd==="p"){
      const voice=msg.member?.voice?.channel;if(!voice)return temp(msg,{embeds:[errorEmbed("Hãy vào voice channel trước.")]});
      if(!arg)return temp(msg,{embeds:[errorEmbed(`Dùng ${config.prefix}play <tên bài hoặc link>`)]});
      const old=music.getPlayer(msg.guild.id);if(old&&old.voiceId!==voice.id)return temp(msg,{embeds:[errorEmbed("Bot đang ở voice channel khác.")]});
      const p=old||await music.createPlayer({guildId:msg.guild.id,textId:msg.channel.id,voiceId:voice.id,volume:80,deaf:true,loadBalancer:true});
      p.setTextChannel(msg.channel.id);
      const result=await music.search(arg,{requester:msg.author});if(!result?.tracks?.length)return temp(msg,{embeds:[errorEmbed("Không tìm thấy bài hát.")]});
      if(result.type==="PLAYLIST")p.queue.add(result.tracks);else p.queue.add(result.tracks[0]);
      if(!p.playing&&!p.paused)await p.play();
      await msg.delete().catch(()=>{});return;
    }
    const playerCmds=["pause","resume","skip","previous","prev","stop","np","nowplaying","queue","q","volume","vol","seek","loop","repeat","shuffle","remove","clear","autoplay"];
    if(playerCmds.includes(cmd)){
      const p=await getPlayer(msg);if(!p)return;
      if(cmd==="pause")p.pause(true);
      else if(cmd==="resume")p.pause(false);
      else if(cmd==="skip")p.skip();
      else if(cmd==="previous"||cmd==="prev"){const t=p.getPrevious(true);if(!t)return temp(msg,{embeds:[errorEmbed("Không có bài trước.")]});await p.play(t);}
      else if(cmd==="stop"){await p.destroy();return msg.delete().catch(()=>{});}
      else if(cmd==="np"||cmd==="nowplaying")await updateNP(p);
      else if(cmd==="queue"||cmd==="q"){const x=await msg.channel.send({embeds:[queueEmbed(p)]});setTimeout(()=>x.delete().catch(()=>{}),10000);}
      else if(cmd==="volume"||cmd==="vol"){const n=Number(arg);if(!Number.isInteger(n)||n<1||n>100)return temp(msg,{embeds:[errorEmbed(`Dùng ${config.prefix}volume 1-100`)]});await p.setVolume(n);}
      else if(cmd==="seek"){const s=parseTime(arg);if(s===null||s<0)return temp(msg,{embeds:[errorEmbed(`Dùng ${config.prefix}seek 1:30`)]});await p.seek(s);}
      else if(cmd==="loop"||cmd==="repeat"){const m=arg.toLowerCase()==="off"?"none":arg.toLowerCase();if(!["none","track","queue"].includes(m))return temp(msg,{embeds:[errorEmbed(`Dùng ${config.prefix}loop off|track|queue`)]});p.setLoop(m);}
      else if(cmd==="shuffle"){if(typeof p.queue.shuffle==="function")p.queue.shuffle();}
      else if(cmd==="remove"){const n=Number(arg),list=Array.from(p.queue);if(!Number.isInteger(n)||n<1||n>list.length)return temp(msg,{embeds:[errorEmbed(`Dùng ${config.prefix}remove <số>`)]});if(typeof p.queue.remove!=="function")return temp(msg,{embeds:[errorEmbed("Queue không hỗ trợ remove trong phiên bản hiện tại.")]});p.queue.remove(n-1);}
      else if(cmd==="clear")p.queue.clear();
      else if(cmd==="autoplay"){const m=arg.toLowerCase();if(!["on","off"].includes(m))return temp(msg,{embeds:[errorEmbed(`Dùng ${config.prefix}autoplay on|off`)]});p.data.set("autoplay",m==="on");}
      await updateNP(p);await msg.delete().catch(()=>{});return;
    }
    if(cmd==="ping")return temp(msg,{embeds:[infoEmbed(`🏓 Discord: ${client.ws.ping}ms`)]});
    if(cmd==="node"){const s=[...music.shoukaku.nodes.values()].map(n=>`**${n.name}** — ${n.state===2?"🟢 READY":"🔴 OFFLINE"}`).join("\n")||"Không có node.";return temp(msg,{embeds:[infoEmbed(s)]});}
  }catch(e){console.error("[COMMAND]",e);await temp(msg,{embeds:[errorEmbed("Lệnh gặp lỗi. Kiểm tra log bot/Lavalink.")]});}
}

music.on("playerStart",async(p,t)=>{console.log(`[PLAY] ${p.guildId}: ${t.title}`);await updateNP(p,t);});
music.on("playerEnd",async _p=>{});
music.on("playerEmpty",async p=>{setTimeout(async()=>{if(music.getPlayer(p.guildId)===p&&!p.queue.length&&!p.playing){await updateNP(p,null);await p.destroy().catch(()=>{});}},30000);});
music.on("playerException",(p,d)=>console.error(`[PLAYER EXCEPTION] ${p.guildId}`,d));
music.on("playerStuck",(p,d)=>console.warn(`[PLAYER STUCK] ${p.guildId}`,d));
music.on("playerResolveError",(p,t,m)=>console.warn(`[RESOLVE ERROR] ${p.guildId} ${t?.title}`,m));

client.on("interactionCreate",async i=>{if(!i.isButton()||!i.customId.startsWith("m_"))return;try{const p=music.getPlayer(i.guildId);if(!p)return i.reply({embeds:[errorEmbed("Player không còn tồn tại.")],ephemeral:true});if(i.member?.voice?.channelId!==p.voiceId)return i.reply({embeds:[errorEmbed("Bạn phải ở cùng voice channel với bot.")],ephemeral:true});
  if(i.customId==="m_pause"){p.pause(!p.paused);return i.update({embeds:[nowPlaying(p,p.queue.current)],components:controls(p)});}
  if(i.customId==="m_skip"){await i.deferUpdate();p.skip();return;}
  if(i.customId==="m_prev"){const t=p.getPrevious(true);if(!t)return i.reply({embeds:[errorEmbed("Không có bài trước.")],ephemeral:true});await i.deferUpdate();await p.play(t);return;}
  if(i.customId==="m_stop"){await i.update({embeds:[infoEmbed("⏹️ Music stopped.")],components:[]});await p.destroy();return;}
  if(i.customId==="m_queue")return i.reply({embeds:[queueEmbed(p)],ephemeral:true});
}catch(e){console.error("[BUTTON]",e);if(!i.replied&&!i.deferred)await i.reply({embeds:[errorEmbed("Không xử lý được nút.")],ephemeral:true}).catch(()=>{});}});
client.on("messageCreate",onCommand);
client.once("ready",()=>{console.log(`[DISCORD] ${client.user.tag} READY`);console.log(`[BOT] Prefix=${config.prefix}`);console.log(`[LAVALINK] ${config.lavalink.host}:${config.lavalink.port}`);client.user.setPresence({activities:[{name:config.status,type:ActivityType.Listening}],status:"online"});});
client.on("error",e=>console.error("[DISCORD]",e));client.on("warn",e=>console.warn("[DISCORD]",e));
process.on("unhandledRejection",e=>console.error("[UNHANDLED REJECTION]",e));process.on("uncaughtException",e=>console.error("[UNCAUGHT EXCEPTION]",e));
const shutdown=async signal=>{console.log(`[SYSTEM] ${signal}`);for(const p of music.players.values())await p.destroy().catch(()=>{});client.destroy();process.exit(0);};
process.once("SIGTERM",()=>shutdown("SIGTERM"));process.once("SIGINT",()=>shutdown("SIGINT"));
await client.login(config.token);
