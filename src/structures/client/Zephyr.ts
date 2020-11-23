import chalk from "chalk";
import stripAnsi from "strip-ansi";
import { Client } from "eris";
import config from "../../../config.json";
import { CommandLib } from "../../lib/command/CommandLib";
import { GuildService } from "../../lib/database/services/guild/GuildService";

export class Zephyr extends Client {
  version: string = "beta-0.0.2";
  commandLib = new CommandLib();
  prefixes: { [guildId: string]: string } = {};
  config: typeof config;
  constructor() {
    super(config.discord.token);
    this.config = config;
  }

  public async start() {
    const startTime = Date.now();
    this.on("ready", async () => {
      await this.commandLib.setup(this);
      await this.cachePrefixes();

      const header = `===== ${chalk.hex(
        `#1fb7cf`
      )`PROJECT: ZEPHYR`} (${chalk.hex(`#1fb7cf`)`${this.version}`}) =====`;
      console.log(
        header +
          `\n\n- Took ${chalk.hex("1794E6")`${
            Date.now() - startTime
          }`}ms to start.` +
          `\n- Cached ${chalk.hex(
            "1794E6"
          )`${this.guilds.size.toLocaleString()}`} guild(s) / ${chalk.hex(
            "1794E6"
          )`${this.users.size.toLocaleString()}`} user(s)` +
          `\n- ${chalk.hex(
            `1794E6`
          )`${this.commandLib.commands.length}`} commands registered` +
          `\n\n${`=`.repeat(stripAnsi(header).length)}`
      );
    });
    this.on("messageCreate", async (message) => {
      if (message.author.bot) return;
      await this.commandLib.process(message, this);
    });

    this.connect();
  }

  public async cachePrefixes() {
    const prefixes = await GuildService.getPrefixes();
    return (this.prefixes = prefixes);
  }
  public getPrefix(guildId?: string): string {
    if (!guildId) return config.discord.defaultPrefix;
    return this.prefixes[guildId] ?? config.discord.defaultPrefix;
  }
  public setPrefix(guildId: string, prefix: string): void {
    this.prefixes[guildId] = prefix;
  }
}
