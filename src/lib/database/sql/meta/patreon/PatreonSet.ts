import dayjs from "dayjs";
import { DB } from "../../..";
import { GameProfile } from "../../../../../structures/game/Profile";

export async function addPatron(profile: GameProfile): Promise<void> {
  await DB.query(
    `INSERT INTO patron (discord_id) VALUES (?) ON DUPLICATE KEY UPDATE discord_id=discord_id;`,
    [profile.discordId]
  );
  return;
}

export async function removePatron(profile: GameProfile): Promise<void> {
  await DB.query(`DELETE FROM patron WHERE discord_id=?;`, [profile.discordId]);
  return;
}

export async function setNextPatreonClaimTime(
  profile: GameProfile
): Promise<void> {
  const formattedTimestamp = dayjs()
    .add(1, "month")
    .startOf("month")
    .format(`YYYY/MM/DD HH:mm:ss`);

  await DB.query(`UPDATE patron SET next_frame_time=? WHERE discord_id=?;`, [
    formattedTimestamp,
    profile.discordId,
  ]);
}

export * as PatreonSet from "./PatreonSet";
