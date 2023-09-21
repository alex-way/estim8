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
			adminDeviceId: null,
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

function getDeviceIdFromName(roomId: string, name: string): string | null {
	const roomState = getRoomStateOrDefault(roomId);
	for (const [deviceId, value] of Object.entries(roomState.users)) {
		if (value.name === name) {
			return deviceId;
		}
	}
	return null;
}

export const actions = {
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

		const nameAlreadyPresent =
			getDeviceIdFromName(params.id, parsedName.data) !== null;
		if (nameAlreadyPresent) {
			return {
				body: "Name already exists",
				status: 400,
			};
		}

		// if there's no devices in the room already, set this device as admin
		const roomState = getRoomStateOrDefault(params.id);
		if (roomState.adminDeviceId === null) {
			roomState.adminDeviceId = locals.deviceId;
		}
		setRoomState(params.id, roomState);

		setNameForRoom(params.id, locals.deviceId, parsedName.data);
		return {};
	},
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
	inverseDisplay: async ({ params }) => {
		const roomState = getRoomStateOrDefault(params.id);

		roomState.showResults = !roomState.showResults;

		setRoomState(params.id, roomState);
		return {};
	},
	clear: async ({ params }) => {
		const roomState = getRoomStateOrDefault(params.id);
		for (const [_, value] of Object.entries(roomState.users)) {
			value.chosenNumber = null;
		}
		roomState.showResults = false;

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
