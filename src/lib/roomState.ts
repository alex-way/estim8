import Pusher from "pusher";
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { dev } from "$app/environment";
import { randomUUID } from "crypto";
import { DEFAULT_CHOICES } from "./constants";
import type { PersistentStorage } from "$lib/storage/base";
import type { RoomState, RoomUser } from "$lib/types";
import { MemoryStorage, TursoStorage } from "$lib/storage";

const TEN_MINUTES = 60 * 10;

export const pusher = new Pusher({
	appId: privateEnv.PUSHER_APP_ID,
	key: publicEnv.PUBLIC_PUSHER_APP_KEY,
	secret: privateEnv.PUSHER_SECRET,
	cluster: "eu",
	useTLS: true,
});

export class Room {
	id: string;
	state: RoomState;
	#lastSavedState: string;

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
		this.id = id;
		this.state = state;
		this.#lastSavedState = JSON.stringify(state);
	}

	static async createRoom(config: { id?: string; choices?: number[] }) {
		const roomId = config.id ?? randomUUID();

		const state = {
			users: {},
			config: {
				selectableNumbers: config.choices ?? [...DEFAULT_CHOICES],
				allowObserversToSnoop: false,
			},
			showResults: false,
			adminDeviceId: null,
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
	static async getRoom(id: string) {
		const kv = Room.getPersistentStorage();
		const existingRoomState = await kv.get(id);

		return existingRoomState
			? new Room(id, existingRoomState)
			: Room.createRoom({ id });
	}

	private static getPersistentStorage(): PersistentStorage {
		if (dev) {
			return new MemoryStorage();
		}
		return new TursoStorage();
	}

	setAdmin(deviceId: string) {
		this.state.adminDeviceId = deviceId;
	}

	setNameForDeviceId(deviceId: string, name: string) {
		const user = this.getUserOrDefault(deviceId);
		user.name = name;
	}

	getDeviceIdFromName(name: string): string | null {
		for (const [deviceId, user] of Object.entries(this.state.users)) {
			if (user.name === name) {
				return deviceId;
			}
		}
		return null;
	}

	getUserFromName(name: string): RoomUser | null {
		for (const [_, user] of Object.entries(this.state.users)) {
			if (user.name === name) {
				return user;
			}
		}
		return null;
	}

	getUserFromDeviceId(deviceId: string): RoomUser | null {
		const user = this.state.users[deviceId];
		if (user) return user;
		return null;
	}

	setChosenNumberForDeviceId(deviceId: string, chosenNumber: number) {
		const user = this.getUserOrDefault(deviceId);
		user.chosenNumber = chosenNumber;
	}

	invertShowResults() {
		this.state.showResults = !this.state.showResults;
	}

	invertSnooping() {
		this.state.config.allowObserversToSnoop =
			!this.state.config.allowObserversToSnoop;
	}

	clearSelectedNumbers() {
		for (const [_, user] of Object.entries(this.state.users)) {
			user.chosenNumber = null;
		}
		this.state.showResults = false;
	}

	updateSelectableNumbers(selectableNumbers: number[]) {
		this.state.config.selectableNumbers = selectableNumbers;
		this.clearSelectedNumbers();
	}

	getUserOrDefault(deviceId: string): RoomUser {
		const existingUser = this.getUserFromDeviceId(deviceId);
		if (existingUser) return existingUser;

		this.state.users[deviceId] = {
			deviceId,
			name: "",
			chosenNumber: null,
			isParticipant: true,
		};

		return this.state.users[deviceId];
	}

	setUserAsObserver(deviceId: string) {
		const user = this.getUserOrDefault(deviceId);
		user.isParticipant = false;
	}

	setUserAsParticipant(deviceId: string) {
		const user = this.getUserOrDefault(deviceId);
		user.isParticipant = true;
	}

	inverseUserParticipation(deviceId: string) {
		const user = this.getUserOrDefault(deviceId);
		user.isParticipant = !user.isParticipant;
	}

	removeUser(deviceId: string) {
		delete this.state.users[deviceId];
	}

	isModified(): boolean {
		return this.#lastSavedState !== JSON.stringify(this.state);
	}

	async save(): Promise<Room> {
		const kv = Room.getPersistentStorage();
		await kv.set(this.id, this.state, {
			ex: TEN_MINUTES,
		});
		this.#lastSavedState = JSON.stringify(this.state);

		await pusher.trigger(`cache-${this.id}`, "room-update", this.state);
		return this;
	}
}
