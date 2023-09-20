import type { Actions } from "./$types";
import Pusher from "pusher";
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import z from "zod";
import type { RoomState } from "./types";

const pusher = new Pusher({
	appId: privateEnv.PUSHER_APP_ID,
	key: publicEnv.PUBLIC_PUSHER_APP_KEY,
	secret: privateEnv.PUSHER_SECRET,
	cluster: "eu",
	useTLS: true,
});

const globalRoomState = new Map<string, RoomState>();

function getRoomStateOrDefault(roomId: string): RoomState {
	return (
		globalRoomState.get(roomId) || {
			users: {},
			showResults: false,
			selectableNumbers: [0, 1, 2, 3, 5, 8, 13, 21],
		}
	);
}

function setRoomState(roomId: string, roomState: RoomState) {
	globalRoomState.set(roomId, roomState);
	pusher.trigger(roomId, "room-update", roomState);
}

function setNameForRoom(roomId: string, deviceId: string, name: string) {
	const roomState = getRoomStateOrDefault(roomId);
	roomState.users[deviceId] = roomState.users[deviceId] || {
		name: "",
		chosenNumber: null,
		isParticipant: true,
	};

	roomState.users[deviceId].name = name;

	setRoomState(roomId, roomState);
}

function setSelectedNumberForRoom(
	roomId: string,
	deviceId: string,
	chosenNumber: number,
) {
	const roomState = getRoomStateOrDefault(roomId) || {};
	roomState.users[deviceId] = roomState.users[deviceId] || {
		name: "",
		chosenNumber: null,
	};

	roomState.users[deviceId].chosenNumber = chosenNumber;

	setRoomState(roomId, roomState);
}

export const actions = {
	submitNumber: async ({ request, params, locals }) => {
		const formData = await request.formData();

		const schema = z.coerce.number();

		const parsedNumber = schema.safeParse(formData.get("chosenNumber"));

		if (!parsedNumber.success) {
			return {
				body: parsedNumber.error,
				status: 400,
			};
		}

		setSelectedNumberForRoom(params.id, locals.deviceId, parsedNumber.data);
		return {};
	},
	setName: async ({ request, locals, params }) => {
		const formData = await request.formData();

		const schema = z.string();

		const parsedName = schema.safeParse(formData.get("name"));
		if (!parsedName.success) {
			return {
				body: "Name is required",
				status: 400,
			};
		}
		// Check name doesn't already exist for some other device
		const roomState = getRoomStateOrDefault(params.id);
		for (const [deviceId, value] of Object.entries(roomState.users)) {
			if (value.name === parsedName.data && deviceId !== locals.deviceId) {
				return {
					body: "Name already exists",
					status: 400,
				};
			}
		}

		setNameForRoom(params.id, locals.deviceId, parsedName.data);

		return {};
	},
	inverseDisplay: async ({ request, locals, params }) => {
		const roomState = getRoomStateOrDefault(params.id);

		roomState.showResults = !roomState.showResults;

		setRoomState(params.id, roomState);
		return {};
	},
	clear: async ({ request, locals, params }) => {
		const roomState = getRoomStateOrDefault(params.id);
		for (const [_, value] of Object.entries(roomState.users)) {
			value.chosenNumber = null;
		}

		setRoomState(params.id, roomState);
		return {};
	},
} satisfies Actions;

export const load = async ({ params, locals }) => {
	const roomState = getRoomStateOrDefault(params.id);
	const name = roomState.users[locals.deviceId]?.name;
	return {
		deviceId: locals.deviceId,
		name,
		roomState,
	};
};
