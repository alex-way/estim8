import { randomUUID } from "node:crypto";
import { db } from "$db";
import schema from "$db/schema";
import { pusher } from "$hooks/server";
import type { Choice, RoomState } from "$lib/types";
import { eq, sql } from "drizzle-orm";
import { DEFAULT_CHOICES, getChannelName } from "../constants";
import { BaseRoom } from "./base";

export class Room extends BaseRoom {
	id: string;
	state: RoomState;

	/**
	 * NOTE: The constructor is now `private`.
	 * This is totally optional if we intend
	 * to prevent outsiders from invoking the
	 * constructor directly.
	 *
	 * It must be noted that as of writing, private
	 * constructors are a TypeScript-exclusive feature.
	 * For the meantime, the JavaScript-compatible equivalent
	 * is the @private annotation from JSDoc, which should
	 * be enforced by most language servers. See the annotation
	 * below for example:
	 *
	 * @private
	 */
	private constructor(id: string, state: RoomState) {
		super(state);
		this.id = id;
		this.state = state;
	}

	static async createRoom(config: { id?: string; choices?: number[] }, adminDeviceId?: string) {
		const roomId = config.id ?? randomUUID();

		const state = {
			users: {},
			config: {
				selectableNumbers: config.choices ?? [...DEFAULT_CHOICES],
				allowObserversToSnoop: false,
				allowUnknown: true,
			},
			showResults: false,
			adminDeviceId: adminDeviceId ?? null,
		} as RoomState;

		const room = new Room(roomId, state);
		await room.save();

		return room;
	}

	/**
	 * This static factory function now serves as
	 * the user-facing constructor for this class.
	 * It indirectly invokes the `constructor` in
	 * the end, which allows us to leverage the
	 * `async`-`await` syntax before finally passing
	 * in the "ready" data to the `constructor`.
	 */
	static async getRoom(id: string): Promise<Room | null> {
		const result = await db.select().from(schema.rooms).where(eq(schema.rooms.id, id)).limit(1);
		if (result.length === 0) {
			return null;
		}

		return new Room(id, result[0].state);
	}

	static async persistChosenNumberForDeviceId(roomId: string, deviceId: string, choice: Choice) {
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

	async save(notify = false): Promise<Room> {
		if (notify) {
			const channelName = getChannelName(this.id);
			// not awaiting this because we don't want to block
			pusher.trigger(channelName, "room-update", this.state);
		}

		return db
			.insert(schema.rooms)
			.values({
				id: this.id,
				state: this.state,
			})
			.onConflictDoUpdate({
				target: schema.rooms.id,
				set: { state: this.state, updated_at: sql`CURRENT_TIMESTAMP` },
			})
			.returning({ state: schema.rooms.state })
			.then((result) => new Room(this.id, result[0].state));
	}
}
