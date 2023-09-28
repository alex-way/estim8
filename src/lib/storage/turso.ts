import type { RoomState } from "$lib/types";
import type { PersistentStorage } from "./base";
import { createClient as createTursoClient } from "@libsql/client";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import schema from "$db/schema";
import { env } from "$env/dynamic/private";

const client = createTursoClient({
	url: env.TURSO_URL,
	authToken: env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, {
	schema,
});

export class TursoStorage implements PersistentStorage {
	async get(key: string): Promise<RoomState | null> {
		const result = await db
			.select()
			.from(schema.rooms)
			.where(eq(schema.rooms.id, key))
			.limit(1);
		if (result.length > 0) {
			return result[0].state;
		}
		return null;
	}

	async set(
		key: string,
		value: RoomState,
		options?: { ex?: number | undefined } | undefined,
	): Promise<void> {
		await db
			.insert(schema.rooms)
			.values({
				id: key,
				state: value,
			})
			.onConflictDoUpdate({
				target: schema.rooms.id,
				set: { state: value, updated_at: sql`CURRENT_TIMESTAMP` },
			});
	}
}
