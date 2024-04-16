import { randomUUID } from "node:crypto";
import { db } from "$db";
import schema from "$db/schema";
import { pusher } from "$hooks/server";
import type { CardBack, Choice, RoomState, RoomUser } from "$lib/types";
import { eq, sql } from "drizzle-orm";
import { DEFAULT_CHOICES, getChannelName } from "../constants";

export class Room {
	id: string;
	state: RoomState;
	#lastSavedState: string;

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

	getUserFromName(name: string): RoomUser | undefined {
		for (const [_, user] of Object.entries(this.state.users)) {
			if (user.name === name) {
				return user;
			}
		}
	}

	getUserFromDeviceId(deviceId: string): RoomUser | undefined {
		return this.state.users[deviceId];
	}

	setChosenNumberForDeviceId(deviceId: string, choice: Choice) {
		const user = this.getUserOrDefault(deviceId);
		user.choice = choice;
	}

	invertShowResults() {
		this.state.showResults = !this.state.showResults;
	}

	invertSnooping() {
		this.state.config.allowObserversToSnoop = !this.state.config.allowObserversToSnoop;
	}

	invertAllowUnknown() {
		this.state.config.allowUnknown = !this.state.config.allowUnknown;
		if (!this.state.config.allowUnknown) {
			for (const [_, user] of Object.entries(this.state.users).filter(([_, user]) => user.choice === "?")) {
				user.choice = null;
			}
		}
	}

	clearSelectedNumbers() {
		for (const [_, user] of Object.entries(this.state.users)) {
			user.choice = null;
		}
		this.state.showResults = false;
	}

	updateSelectableNumbers(selectableNumbers: number[]) {
		this.state.config.selectableNumbers = selectableNumbers.sort((a, b) => a - b);
		this.clearSelectedNumbers();
	}

	setCardBackForDeviceId(deviceId: string, cardBack: CardBack) {
		const user = this.getUserOrDefault(deviceId);
		user.config = { ...user.config, cardBack };
	}

	getUserOrDefault(deviceId: string): RoomUser {
		const existingUser = this.getUserFromDeviceId(deviceId);
		if (existingUser) return existingUser;

		this.state.users[deviceId] = {
			deviceId,
			name: "",
			choice: null,
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

	setUserParticipation(deviceId: string, isParticipant: boolean) {
		const user = this.getUserOrDefault(deviceId);
		user.isParticipant = isParticipant;
	}

	removeUsersNotInRoom(usersInRoom: string[]) {
		const usersNotInRoom = Object.keys(this.state.users).filter((user) => !usersInRoom.includes(user));

		for (const user of usersNotInRoom) {
			this.removeUser(user);
		}
	}

	removeUser(deviceId: string) {
		delete this.state.users[deviceId];
	}

	isModified(): boolean {
		return this.#lastSavedState !== JSON.stringify(this.state);
	}

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
