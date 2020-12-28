import { Message, User } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { AnticheatService } from "../../../lib/database/services/meta/AnticheatService";

export default class UserInfo extends BaseCommand {
  names = ["userinfo", "ui"];
  description = "Shows you information about a user.";
  allowDm = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    let targetUser: User | undefined;
    if (msg.mentions[0]) {
      targetUser = msg.mentions[0];
    } else if (!isNaN(parseInt(this.options[0]))) {
      const userId = parseInt(this.options[0]);
      if (userId.toString().length < 17)
        throw new ZephyrError.InvalidSnowflakeError();

      targetUser = await this.zephyr.fetchUser(userId.toString());
    } else targetUser = msg.author;

    if (!targetUser) throw new ZephyrError.UserNotFoundError();

    const target = await ProfileService.getProfile(targetUser.id);

    const timesVoted = await AnticheatService.getNumberOfVotes(target);
    const timesClaimed = await AnticheatService.getNumberOfClaimedCards(target);
    const timesGifted = await AnticheatService.getNumberOfCardsGifted(target);
    const timesReceivedGift = await AnticheatService.getNumberOfCardsReceivedByGift(
      target
    );

    const embed = new MessageEmbed()
      .setAuthor(`User Info | ${msg.author.tag}`, msg.author.avatarURL)
      .setDescription(
        `Showing stats for **${targetUser.tag}**...` +
          `\n\n— Times voted: **${timesVoted.toLocaleString()}**` +
          `\n— Cards claimed: **${timesClaimed}**` +
          `\n— Cards gifted: **${timesGifted}**` +
          `\n— Gifts received: **${timesReceivedGift}**`
      )
      .setThumbnail(targetUser.dynamicAvatarURL("png"));

    await msg.channel.createMessage({ embed });
  }
}
