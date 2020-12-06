import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { parseIdentifier } from "../../../lib/ZephyrUtils";

export default class CardSearch extends BaseCommand {
  names = ["cardsearch", "cs"];
  description = "Shows you information about a card.";
  usage = ["$CMD$ <card>"];

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const identifier = this.options[0];
    let card;
    if (!identifier) {
      card = await CardService.getLastCard(msg.author.id);
    } else {
      const id = parseIdentifier(identifier);
      if (isNaN(id)) throw new ZephyrError.InvalidCardReferenceError();
      card = await CardService.getUserCardById(id);
    }

    const baseCard = this.zephyr.getCard(card.baseCardId);

    const owner = await this.zephyr.fetchUser(card.discordId);
    const ownerProfile = await ProfileService.getProfile(card.discordId);
    const originalOwner = await this.zephyr.fetchUser(card.originalOwner);
    const originalProfile = await ProfileService.getProfile(card.originalOwner);

    const embed = new MessageEmbed()
      .setAuthor(
        `Card Search | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `:bust_in_silhouette: Owned by ${
          ownerProfile.private && owner.id !== msg.author.id
            ? `*Private User*`
            : `**${owner.tag}**`
        }` +
          `\n— **${baseCard.group ? `${baseCard.group} ` : ``}${
            baseCard.name
          }** ${baseCard.subgroup ? `(${baseCard.subgroup})` : ``}` +
          `\n— Issue **#${card.serialNumber}**` +
          `\n— Wear: **${
            ["Damaged", "Poor", "Average", "Good", "Great", "Mint"][card.wear]
          }**` +
          `${
            card.frameId !== null && card.frameId !== 1
              ? `\n— Frame: **${card.frameName}**`
              : ``
          }`
      )
      .setFooter(
        `Card originally owned by ${
          originalProfile.private && originalOwner.id !== msg.author.id
            ? `Private User`
            : `${originalOwner.tag}`
        }`
      );
    await msg.channel.createMessage({ embed });
  }
}
