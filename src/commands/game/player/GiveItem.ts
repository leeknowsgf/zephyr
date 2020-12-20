import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import items from "../../../assets/items.json";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { BaseItem, GameItem } from "../../../structures/game/Item";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ReactionCollector } from "eris-collector";

export default class GiveItem extends BaseCommand {
  names = ["giveitem", "gi"];
  description = "Gives someone an item";
  usage = ["$CMD$ <@mention> <item[s]>"];

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    if (this.options.length === 0)
      throw new ZephyrError.InvalidMentionItemError(false);

    let targetUser;
    let target: GameProfile | undefined;
    if (msg.mentions[0]) {
      targetUser = msg.mentions[0];
      target = await ProfileService.getProfile(targetUser.id);
    }

    const itemsRaw = this.options
      .join(" ")
      .split(",")
      .map((i) => i.replace(/<((@!?\d+)|(:.+?:\d+))>/g, ``).trim());

    if (itemsRaw.length < 1) throw new ZephyrError.NoItemsSpecifiedError();

    const realItems: GameItem[] = [];
    const baseItems: BaseItem[] = [];
    for (let i of itemsRaw) {
      const target = items.items.filter(
        (t) => t.name.toLowerCase() === i.toLowerCase()
      );

      if (target[0]) {
        const inventoryItem = await ProfileService.getItem(
          profile,
          target[0].id,
          target[0].name
        );
        if (inventoryItem.count === 0)
          throw new ZephyrError.NoItemInInventoryError(target[0].name);

        baseItems.push(target[0]);
        realItems.push(inventoryItem);
      }
    }

    if (realItems.length < 1) throw new ZephyrError.InvalidItemError();
    if (!target || !targetUser)
      throw new ZephyrError.InvalidMentionItemError(realItems.length > 1);

    const embed = new MessageEmbed()
      .setAuthor(
        `Give Item | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Really gift **${realItems.length}** item${
          realItems.length === 1 ? `` : `s`
        } to ${targetUser.tag}?\n` +
          realItems
            .map((_i, idx) => `— \`${baseItems[idx].name}\` **x1**`)
            .join("\n")
      );
    const conf = await msg.channel.createMessage({ embed });
    await conf.addReaction(`check:${this.zephyr.config.discord.emojiId.check}`);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(this.zephyr, conf, filter, {
      time: 30000,
      max: 1,
    });

    collector.on("collect", async () => {
      for (let i of realItems) {
        try {
          const refetchItem = await ProfileService.getItem(
            profile,
            i.itemId,
            baseItems[realItems.indexOf(i)].name
          );

          if (refetchItem.count < 1) {
            await conf.edit({
              embed: embed.setFooter(
                `⚠️ You have no ${baseItems[realItems.indexOf(i)].name}.`
              ),
            });
            return;
          }
        } catch {}
      }

      await ProfileService.transferItems(target!, profile, realItems);

      await conf.edit({
        embed: embed.setFooter(
          `🎁 ${realItems.length} item${
            realItems.length === 1 ? ` has` : `s have`
          } been gifted.`
        ),
      });
      collector.en;
      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await conf.edit({
          embed: embed.setFooter(`🕒 This item gift offer has expired.`),
        });
        await conf.removeReaction(
          `check:${this.zephyr.config.discord.emojiId.check}`,
          this.zephyr.user.id
        );
        return;
      }
    });
  }
}
