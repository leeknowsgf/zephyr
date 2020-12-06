import { Message, User } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";

export default class ViewProfile extends BaseCommand {
  names = ["profile", "p"];
  usage = ["$CMD$", "$CMD$ <@mention>", "$CMD$ id=USER_ID"];
  description = "Displays your profile.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    let target: GameProfile | string;
    let user: User;
    if (msg.mentions[0]) {
      user = msg.mentions[0];
      target = msg.mentions[0].id;
    } else if (this.options[0]?.startsWith("id=")) {
      const userId = parseInt(this.options[0].slice(3), 10);
      if (isNaN(userId) || userId === 0)
        throw new ZephyrError.InvalidSnowflakeError();

      user = await this.zephyr.fetchUser(userId.toString());
      target = user.id;
    } else {
      user = msg.author;
      target = profile;
    }

    if (typeof target === "string") {
      target = await ProfileService.getProfile(target);
    }

    if (target.private && target.discordId !== msg.author.id)
      throw new ZephyrError.PrivateProfileError(user.tag);

    const embed = new MessageEmbed()
      .setAuthor(`Profile | ${user.tag}`, msg.author.avatarURL)
      .setDescription(
        `**Blurb**` +
          `\n${target.blurb || "*No blurb set*"}` +
          `\n\n— ${
            target.discordId === msg.author.id ? `You have` : `${user.tag} has`
          } ${
            this.zephyr.config.discord.emoji.bits
          }**${target.bits.toLocaleString()}**.`
      )
      .setFooter(
        target.discordId === msg.author.id
          ? `Your profile is currently ${
              target.private ? `private` : `public`
            }.`
          : ``
      );
    await msg.channel.createMessage({ embed });
  }
}
