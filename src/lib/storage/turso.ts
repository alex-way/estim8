import { db } from "$db";
import schema from "$db/schema";
import type { Choice, RoomState } from "$lib/types";
import { eq, sql } from "drizzle-orm";
import type { PersistentStorage } from "./base";

export class TursoStorage implements PersistentStorage {
	async get(key: string): Promise<RoomState | null> {
		const result = await db.select().from(schema.rooms).where(eq(schema.rooms.id, key)).limit(1);
		if (result.length > 0) {
			return result[0].state;
		}
		return null;
	}

	async set(key: string, value: RoomState): Promise<RoomState> {
		return db
			.insert(schema.rooms)
			.values({
				id: key,
				state: value,
			})
			.onConflictDoUpdate({
				target: schema.rooms.id,
				set: { state: value, updated_at: sql`CURRENT_TIMESTAMP` },
			})
			.returning({ state: schema.rooms.state })
			.then((result) => result[0].state);
	}

	async persistChosenNumberForDeviceId(roomId: string, deviceId: string, choice: Choice): Promise<RoomState> {
		const key = `$.users.${deviceId}.choice`;
		return db
			.update(schema.rooms)
			.set({
				state: sql`json_set(state, ${key}, ${choice})`,
			})
			.where(eq(schema.rooms.id, roomId))
			.returning({ state: schema.rooms.state })
			.then((result) => {
				return result[0].state;
			});
	}
}
