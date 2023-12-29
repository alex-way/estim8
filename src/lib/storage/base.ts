import type { Choice, RoomState } from "$lib/types";

export interface PersistentStorage {
	get(key: string): Promise<RoomState | null>;
	set(key: string, value: RoomState): Promise<RoomState>;
	persistChosenNumberForDeviceId(
		roomId: string,
		deviceId: string,
		choice: Choice,
	): Promise<RoomState>;
}
