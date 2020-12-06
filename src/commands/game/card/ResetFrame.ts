import { Message, PartialEmoji } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ReactionCollector } from "eris-collector";
import { idToIdentifier, parseIdentifier } from "../../../lib/ZephyrUtils";
import { GameUserCard } from "../../../structures/game/UserCard";

export default class ResetFrame extends BaseCommand {
  names = ["resetframe", "rf"];
  description = "Resets the frame of a card to default.";
  usage = ["$CMD$ <card>"];

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const identifier = this.options[0];
    let card: GameUserCard;
    if (!identifier) {
      card = await CardService.getLastCard(msg.author.id);
    } else {
      card = await CardService.getUserCardById(
        parseIdentifier(this.options[0])
      );
    }

    if (card.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(card);

    if (card.frameName?.includes("Default"))
      throw new ZephyrError.FrameAlreadyDefaultError(card);

    const conf = await msg.channel.createMessage(
      `${
        this.zephyr.config.discord.emoji.warn
      } Really reset the frame of \`${idToIdentifier(card.id)}\`?`
    );
    await conf.addReaction(`check:${this.zephyr.config.discord.emojiId.check}`);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, conf, filter, {
      time: 30000,
      max: 1,
    });
    collector.on("collect", async () => {
      await CardService.changeCardFrame(card, 1);
      await conf.edit(
        `${
          this.zephyr.config.discord.emoji.check
        } Reset the frame of \`${idToIdentifier(card.id)}\`.`
      );
      collector.en;
      return;
    });
    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await conf.edit(
          `${this.zephyr.config.discord.emoji.warn} Did not reset the frame.`
        );
        await conf.removeReaction(
          `check:${this.zephyr.config.discord.emojiId.check}`,
          this.zephyr.user.id
        );
        return;
      }
    });
  }
}
