import { DEFAULT_CHOICES } from "../constants";
import type { RoomState, RoomUser } from "$lib/types";

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

	setChosenNumberForDeviceId(deviceId: string, chosenNumber: number) {
		const user = this.getUserOrDefault(deviceId);
		user.chosenNumber = chosenNumber;
	}

	invertShowResults() {
		this.state.showResults = !this.state.showResults;
	}

	invertSnooping() {
		this.state.config.allowObserversToSnoop =
			!this.state.config.allowObserversToSnoop;
	}

	clearSelectedNumbers() {
		for (const [_, user] of Object.entries(this.state.users)) {
			user.chosenNumber = null;
		}
		this.state.showResults = false;
	}

	updateSelectableNumbers(selectableNumbers: number[]) {
		this.state.config.selectableNumbers = selectableNumbers;
		this.clearSelectedNumbers();
	}

	getUserOrDefault(deviceId: string): RoomUser {
		const existingUser = this.getUserFromDeviceId(deviceId);
		if (existingUser) return existingUser;

		this.state.users[deviceId] = {
			deviceId,
			name: "",
			chosenNumber: null,
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

	removeUser(deviceId: string) {
		delete this.state.users[deviceId];
	}

	isModified(): boolean {
		return this.#lastSavedState !== JSON.stringify(this.state);
	}
}