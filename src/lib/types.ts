export type RoomUser = {
	deviceId: string;
	name: string;
	chosenNumber: number | null;
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
	};
	adminDeviceId: string | null;
};
