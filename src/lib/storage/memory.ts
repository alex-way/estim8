import type { RoomState } from "$lib/types";
import type { PersistentStorage } from "./base";

const globalRoomState = new Map<string, RoomState>();

export class MemoryStorage implements PersistentStorage {
	async get(key: string): Promise<RoomState | null> {
		const value = globalRoomState.get(key);
		if (!value) return null;
		return value;
	}

	async set(
		key: string,
		value: RoomState,
		options?: { ex?: number },
	): Promise<void> {
		globalRoomState.set(key, value);
	}
}
