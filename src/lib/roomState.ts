import Pusher from "pusher";
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { createClient } from "@vercel/kv";

export type RoomState = {
	// session
	users: {
		[name: string]: RoomUser;
	};
	showResults: boolean;
	selectableNumbers: number[];
	adminDeviceId: string | null;
};

const TEN_MINUTES = 60 * 10;

export const pusher = new Pusher({
	appId: privateEnv.PUSHER_APP_ID,
	key: publicEnv.PUBLIC_PUSHER_APP_KEY,
	secret: privateEnv.PUSHER_SECRET,
	cluster: "eu",
	useTLS: true,
});

export const globalRoomState = new Map<string, RoomState>();

export async function getRoomStateOrDefault(
	roomId: string,
): Promise<RoomState> {
	const kv = createClient({
		token: privateEnv.KV_REST_API_TOKEN,
		url: privateEnv.KV_REST_API_URL,
	});
	const existingRoomState = await kv.get<RoomState>(roomId);

	return (
		existingRoomState ||
		({
			users: {},
			showResults: false,
			selectableNumbers: [2, 5, 8, 13],
			adminDeviceId: null,
		} as RoomState)
	);
}

async function setRoomState(
	roomId: string,
	roomState: RoomState,
): Promise<RoomState> {
	const kv = createClient({
		token: privateEnv.KV_REST_API_TOKEN,
		url: privateEnv.KV_REST_API_URL,
	});
	await kv.set(roomId, roomState, {
		ex: TEN_MINUTES,
	});

	globalRoomState.set(roomId, roomState);
	await pusher.trigger(roomId, "room-update", roomState);
	return roomState;
}

export class RoomUser {
	deviceId: string;
	name: string;
	chosenNumber: number | null;
	isParticipant: boolean;

	constructor(
		deviceId: string,
		name: string,
		chosenNumber: number | null,
		isParticipant: boolean,
	) {
		this.deviceId = deviceId;
		this.name = name;
		this.chosenNumber = chosenNumber;
		this.isParticipant = isParticipant;
	}
}

export class Room {
	id: string;
	state: RoomState;

	/**
	 * NOTE: The constructor is now `private`.
	 * This is totally optional if we intend
	 * to prevent outsiders from invoking the
	 * constructor directly.
	 *
	 * It must be noted that as of writing, private
	 * constructors are a TypeScript-exclusive feature.
	 * For the meantime, the JavaScript-compatible equivalent
	 * is the @private annotation from JSDoc, which should
	 * be enforced by most language servers. See the annotation
	 * below for example:
	 *
	 * @private
	 */
	private constructor(id: string, state: RoomState) {
		this.id = id;
		this.state = state;
	}

	/**
	 * This static factory function now serves as
	 * the user-facing constructor for this class.
	 * It indirectly invokes the `constructor` in
	 * the end, which allows us to leverage the
	 * `async`-`await` syntax before finally passing
	 * in the "ready" data to the `constructor`.
	 */
	static async getRoom(id: string) {
		const state = await getRoomStateOrDefault(id);
		return new Room(id, state);
	}

	setNameForDeviceId(deviceId: string, name: string) {
		this.state.users[deviceId] = this.state.users[deviceId] || {
			name: "",
			chosenNumber: null,
			isParticipant: true,
		};
		this.state.users[deviceId].name = name;
		return this;
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
		const user =
			this.getUserFromDeviceId(deviceId) ||
			new RoomUser(deviceId, "", null, true);
		user.chosenNumber = chosenNumber;
	}

	invertShowResults() {
		this.state.showResults = !this.state.showResults;
	}

	clearSelectedNumbers() {
		for (const [_, user] of Object.entries(this.state.users)) {
			user.chosenNumber = null;
		}
		this.state.showResults = false;
	}

	updateSelectableNumbers(selectableNumbers: number[]) {
		this.state.selectableNumbers = selectableNumbers;
		this.clearSelectedNumbers();
	}

	getUserOrDefault(deviceId: string): RoomUser {
		this.state.users[deviceId] = this.state.users[deviceId] || {
			name: "",
			chosenNumber: null,
			isParticipant: true,
		};
		return new RoomUser(
			this.state.users[deviceId].deviceId,
			this.state.users[deviceId].name,
			this.state.users[deviceId].chosenNumber,
			this.state.users[deviceId].isParticipant,
		);
	}

	setUserAsObserver(deviceId: string) {
		this.state.users[deviceId] = this.state.users[deviceId] || {
			name: "",
			chosenNumber: null,
			isParticipant: true,
		};
		this.state.users[deviceId].isParticipant = false;
	}

	setUserAsParticipant(deviceId: string) {
		this.state.users[deviceId] = this.state.users[deviceId] || {
			name: "",
			chosenNumber: null,
			isParticipant: true,
		};
		this.state.users[deviceId].isParticipant = true;
	}

	async save(): Promise<Room> {
		await setRoomState(this.id, this.state);
		return this;
	}
}