export type RoomState = {
	// session
	users: {
		[name: string]: {
			name: string;
			chosenNumber: number | null;
			// todo: change this to non-optional, default to false or rename to isParticipant
			isParticipant: boolean;
		};
	};
	showResults: boolean;
	selectableNumbers: number[];
	adminDeviceId: string | null;
};
