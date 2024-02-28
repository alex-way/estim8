import type { CardBack, Choice, RoomState, RoomUser } from "$lib/types";

export class BaseRoom {
	state: RoomState;
	#lastSavedState: string;

	constructor(state: RoomState) {
		this.state = state;
		this.#lastSavedState = JSON.stringify(state);
	}

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

	getUserFromName(name: string): RoomUser | null {
		for (const [_, user] of Object.entries(this.state.users)) {
			if (user.name === name) {
				return user;
			}
		}
		return null;
	}

	getUserFromDeviceId(deviceId: string): RoomUser | null {
		const user = this.state.users[deviceId];
		if (user) return user;
		return null;
	}

	setChosenNumberForDeviceId(deviceId: string, choice: Choice) {
		const user = this.getUserOrDefault(deviceId);
		user.choice = choice;
	}

	invertShowResults() {
		this.state.showResults = !this.state.showResults;
	}

	invertSnooping() {
		this.state.config.allowObserversToSnoop =
			!this.state.config.allowObserversToSnoop;
	}

	invertAllowUnknown() {
		this.state.config.allowUnknown = !this.state.config.allowUnknown;
		if (!this.state.config.allowUnknown) {
			for (const [_, user] of Object.entries(this.state.users).filter(
				([_, user]) => user.choice === "?",
			)) {
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
		this.state.config.selectableNumbers = selectableNumbers.sort(
			(a, b) => a - b,
		);
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

	removeUsersNotInRoom(usersInRoom: string[]) {
		const usersNotInRoom = Object.keys(this.state.users).filter(
			(user) => !usersInRoom.includes(user),
		);

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
}
