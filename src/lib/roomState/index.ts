import { randomUUID } from "node:crypto";
import { persistentStorage, pusher } from "$hooks/server";
import type { PersistentStorage } from "$lib/storage/base";
import type { Choice, RoomState } from "$lib/types";
import { DEFAULT_CHOICES } from "../constants";
import { BaseRoom } from "./base";

export class Room extends BaseRoom {
	id: string;
	state: RoomState;
	#persistentStorage: PersistentStorage;

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
		this.#persistentStorage = Room.getPersistentStorage();
	}

	static async createRoom(
		config: { id?: string; choices?: number[] },
		adminDeviceId?: string,
	) {
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
		const kv = Room.getPersistentStorage();
		const existingRoomState = await kv.get(id);

		if (!existingRoomState) return null;

		return new Room(id, existingRoomState);
	}

	private static getPersistentStorage(): PersistentStorage {
		return persistentStorage;
	}

	static async persistChosenNumberForDeviceId(
		roomId: string,
		deviceId: string,
		choice: Choice,
	) {
		const kv = Room.getPersistentStorage();

		const room = await kv
			.persistChosenNumberForDeviceId(roomId, deviceId, choice)
			.catch((err) => {
				console.error(err);
				throw err;
			});
		pusher.trigger(`presence-cache-${roomId}`, "room-update", room);
		return room;
	}

	async save(): Promise<Room> {
		// not awaiting this because we don't want to block
		pusher.trigger(`presence-cache-${this.id}`, "room-update", this.state);

		await this.#persistentStorage.set(this.id, this.state);

		return this;
	}
}
