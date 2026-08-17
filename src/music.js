import { Kazagumo } from "kazagumo";
import { Connectors } from "shoukaku";
import { config } from "./config.js";

export function createMusic(client) {
  const nodes = [{
    name: "main",
    url: `${config.lavalink.host}:${config.lavalink.port}`,
    auth: config.lavalink.password,
    secure: config.lavalink.secure
  }];

  const music = new Kazagumo(
    {
      defaultSearchEngine: "youtube",
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      }
    },
    new Connectors.DiscordJS(client),
    nodes,
    {
      reconnectTries: 20,
      reconnectInterval: 5,
      restTimeout: 15000,
      moveOnDisconnect: false,
      resumable: true,
      resumableTimeout: 120,
      voiceConnectionTimeout: 20
    }
  );

  music.shoukaku.on("ready", (name, resumed) => console.log(`[LAVALINK] ${name} READY${resumed ? " RESUMED" : ""}`));
  music.shoukaku.on("error", (name, error) => console.error(`[LAVALINK] ${name} ERROR`, error));
  music.shoukaku.on("close", (name, code, reason) => console.warn(`[LAVALINK] ${name} CLOSED ${code} ${reason || ""}`));
  music.shoukaku.on("disconnect", (name, count) => console.warn(`[LAVALINK] ${name} DISCONNECTED ${count ?? ""}`));
  music.shoukaku.on("debug", (name, info) => console.debug(`[LAVALINK DEBUG] ${name}`, info));
  return music;
}
