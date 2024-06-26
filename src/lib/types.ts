export type Choice = number | "?";

export const cardBacks = ["default", "red", "blue", "green", "yellow", "orange", "pink", "purple", "magic"] as const;
export type CardBack = (typeof cardBacks)[number];

export type RoomUser = {
	deviceId: string;
	name: string;
	choice: Choice | null;
	isParticipant: boolean;
	config?: {
		cardBack?: CardBack;
	};
};

export type RoomState = {
	id: string;
	// session
	users: Record<string, RoomUser>;
	showResults: boolean;
	config: {
		selectableNumbers: number[];
		allowObserversToSnoop: boolean;
		allowUnknown: boolean;
	};
	adminDeviceId: string | null;
};
