import { randomUUID } from "node:crypto";
import { db } from "$db";
import schema from "$db/schema";
import type { CardBack, Choice, RoomState, RoomUser } from "$lib/types";
import { and, eq } from "drizzle-orm";

export class Room {
	id: string;

	constructor(id: string) {
		this.id = id;
	}

	static async createRoom(config: { id?: string; choices: number[] }, adminDeviceId: string) {
		const roomId = config.id ?? randomUUID();

		await new DBUser(adminDeviceId).createUser();

		return db
			.insert(schema.room)
			.values({ id: roomId, selectableChoices: config.choices, adminDeviceId })
			.returning({
				id: schema.room.id,
				selectableChoices: schema.room.selectableChoices,
				adminDeviceId: schema.room.adminDeviceId,
			})
			.then((result) => {
				return result[0];
			});
	}

	/**
	 * Adds a user to the room.
	 */
	async addUser(deviceId: string) {
		await new DBUser(deviceId).createUser();

		return db
			.insert(schema.usersToRooms)
			.values({
				roomId: this.id,
				deviceId,
			})
			.onConflictDoNothing()
			.returning()
			.then((result) => result[0]);
	}

	async getRoom(): Promise<RoomState | null> {
		const room = await db.query.room.findFirst({
			where: eq(schema.room.id, this.id),
			with: {
				usersToRooms: {
					with: {
						user: true,
					},
				},
			},
		});
		if (room === undefined) return null;

		const users: Record<string, RoomUser> = room.usersToRooms.reduce(
			(acc, roomUser) => {
				acc[roomUser.deviceId] = {
					deviceId: roomUser.deviceId,
					name: roomUser.user?.name || "",
					choice: roomUser.choice,
					isParticipant: roomUser.isParticipant,
					config: {
						// @ts-ignore
						cardBack: roomUser.user?.cardBack || "default",
					},
				};
				return acc;
			},
			{} as Record<string, RoomUser>,
		);

		return {
			id: room.id,
			adminDeviceId: room.adminDeviceId,
			users,
			config: {
				allowObserversToSnoop: room.allowSnooping,
				allowUnknown: room.allowUnknown,
				selectableNumbers: room.selectableChoices,
			},
			showResults: room.showResults,
		};
	}

	async setAdmin(deviceId: string) {
		return db.update(schema.room).set({ adminDeviceId: deviceId }).where(eq(schema.room.id, this.id));
	}

	async setChoiceForDeviceId(deviceId: string, choice: Choice) {
		return db
			.insert(schema.usersToRooms)
			.values({ choice, roomId: this.id, deviceId })
			.onConflictDoUpdate({
				target: [schema.usersToRooms.roomId, schema.usersToRooms.deviceId],
				set: { choice },
			});
	}

	async clearChoices() {
		return await db.batch([
			db.update(schema.room).set({ showResults: false }).where(eq(schema.room.id, this.id)),
			db.update(schema.usersToRooms).set({ choice: null }).where(eq(schema.usersToRooms.roomId, this.id)),
		]);
	}

	async reveal() {
		return db.update(schema.room).set({ showResults: true }).where(eq(schema.room.id, this.id));
	}

	async setAllowUnknown(allowUnknown: boolean) {
		return db.update(schema.room).set({ allowUnknown }).where(eq(schema.room.id, this.id));
	}

	async setAllowSnooping(allowSnooping: boolean) {
		return db.update(schema.room).set({ allowSnooping }).where(eq(schema.room.id, this.id));
	}

	async setParticipation(deviceId: string, isParticipant: boolean) {
		return db
			.update(schema.usersToRooms)
			.set({ isParticipant })
			.where(and(eq(schema.usersToRooms.roomId, this.id), eq(schema.usersToRooms.deviceId, deviceId)));
	}

	async setChoices(choices: number[]) {
		return db.update(schema.room).set({ selectableChoices: choices }).where(eq(schema.room.id, this.id));
	}

	async removeUser(deviceId: string) {
		return db
			.delete(schema.usersToRooms)
			.where(and(eq(schema.usersToRooms.roomId, this.id), eq(schema.usersToRooms.deviceId, deviceId)));
	}
}

export class DBUser {
	id: string;

	constructor(id: string) {
		this.id = id;
	}

	async createUser(name?: string) {
		return db.insert(schema.user).values({ id: this.id, name }).onConflictDoNothing().returning({ id: schema.user.id });
	}

	async setName(name: string) {
		return db.update(schema.user).set({ name }).where(eq(schema.user.id, this.id));
	}

	async setCardBack(cardBack: CardBack) {
		return db.update(schema.user).set({ cardBack }).where(eq(schema.user.id, this.id));
	}
}
