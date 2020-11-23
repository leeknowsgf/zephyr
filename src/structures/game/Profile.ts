import { ProfileService } from "../../lib/database/services/game/ProfileService";

export interface Profile {
  discord_id: string;
  bits: number;
  bits_bank: number;
  daily_next: number;
}
export class GameProfile {
  discordId: string;
  bits: number;
  bitsBank: number;
  dailyNext: number;
  constructor(data: Profile) {
    this.discordId = data.discord_id;
    this.bits = data.bits;
    this.bitsBank = data.bits_bank;
    this.dailyNext = data.daily_next;
  }

  public async fetch(): Promise<GameProfile> {
    return await ProfileService.getProfile(this.discordId, false);
  }
}
