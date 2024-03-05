import type { Choice, RoomState } from "$lib/types";
import type { PersistentStorage } from "./base";

const globalRoomState = new Map<string, RoomState>();

/**
 * @deprecated
 */
export class MemoryStorage implements PersistentStorage {
	async get(key: string): Promise<RoomState | null> {
		const value = globalRoomState.get(key);
		if (!value) return null;
		return value;
	}

	async set(key: string, value: RoomState): Promise<RoomState> {
		globalRoomState.set(key, value);
		return value;
	}

	async persistChosenNumberForDeviceId(
		roomId: string,
		deviceId: string,
		choice: Choice,
	): Promise<RoomState> {
		const room = await this.get(roomId);
		if (!room) throw new Error("room not found");
		room.users[deviceId].choice = choice;
		return this.set(roomId, room);
	}
}
