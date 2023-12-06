import { randomUUID } from "crypto";
import { dev } from "$app/environment";
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { MemoryStorage, TursoStorage } from "$lib/storage";
import type { PersistentStorage } from "$lib/storage/base";
import type { RoomState } from "$lib/types";
import Pusher from "pusher";
import { DEFAULT_CHOICES } from "../constants";
import { BaseRoom } from "./base";

const TEN_MINUTES = 60 * 10;

export const pusher = new Pusher({
	appId: privateEnv.PUSHER_APP_ID,
	key: publicEnv.PUBLIC_PUSHER_APP_KEY,
	secret: privateEnv.PUSHER_SECRET,
	cluster: "eu",
	useTLS: true,
});

export class Room extends BaseRoom {
	id: string;
	state: RoomState;
	#lastSavedState: string;
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
		this.#lastSavedState = JSON.stringify(state);
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
		if (dev) {
			return new MemoryStorage();
		}
		return new TursoStorage();
	}

	async save(): Promise<Room> {
		await this.#persistentStorage.set(this.id, this.state, {
			ex: TEN_MINUTES,
		});
		this.#lastSavedState = JSON.stringify(this.state);

		await pusher.trigger(`presence-${this.id}`, "room-update", this.state);
		return this;
	}
}
