import type { RoomState } from "$lib/types";
export interface PersistentStorage {
	get(key: string): Promise<RoomState | null>;
	set(key: string, value: RoomState, options?: { ex?: number }): Promise<void>;
}
