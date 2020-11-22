import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";

export default class Ping extends BaseCommand {
  names = ["ping"];
  description = "Hello.";

  async exec(msg: Message): Promise<void> {
    await msg.channel.createMessage("Hia.");
  }
}
