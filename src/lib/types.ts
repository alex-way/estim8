export type Choice = number | "?";

export type RoomUser = {
	deviceId: string;
	name: string;
	choice: Choice | null;
	isParticipant: boolean;
	config?: {
		cardBackground?: "green" | "red" | "blue" | "yellow" | "white";
	};
};

export type RoomState = {
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
