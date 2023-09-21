import type { Actions } from "./$types";
import Pusher from "pusher";
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import z from "zod";
import type { RoomState } from "./types";
import { createClient } from "@vercel/kv";

const pusher = new Pusher({
	appId: privateEnv.PUSHER_APP_ID,
	key: publicEnv.PUBLIC_PUSHER_APP_KEY,
	secret: privateEnv.PUSHER_SECRET,
	cluster: "eu",
	useTLS: true,
});

const globalRoomState = new Map<string, RoomState>();

async function getRoomStateOrDefault(roomId: string): Promise<RoomState> {
	const kv = createClient({
		token: privateEnv.KV_REST_API_TOKEN,
		url: privateEnv.KV_REST_API_URL,
	});
	const existingRoomState = await kv.get<RoomState>(roomId);

	return (
		existingRoomState || {
			users: {},
			showResults: false,
			selectableNumbers: [0, 1, 2, 3, 5, 8, 13, 21],
			adminDeviceId: null,
		}
	);
}

async function setRoomState(roomId: string, roomState: RoomState) {
	const kv = createClient({
		token: privateEnv.KV_REST_API_TOKEN,
		url: privateEnv.KV_REST_API_URL,
	});
	await kv.set(roomId, roomState);

	globalRoomState.set(roomId, roomState);
	await pusher.trigger(roomId, "room-update", roomState);
}

async function setNameForRoom(roomId: string, deviceId: string, name: string) {
	const roomState = await getRoomStateOrDefault(roomId);
	roomState.users[deviceId] = roomState.users[deviceId] || {
		name: "",
		chosenNumber: null,
		isParticipant: true,
	};

	roomState.users[deviceId].name = name;

	await setRoomState(roomId, roomState);
}

async function setSelectedNumberForRoom(
	roomId: string,
	deviceId: string,
	chosenNumber: number,
) {
	const roomState = (await getRoomStateOrDefault(roomId)) || {};
	roomState.users[deviceId] = roomState.users[deviceId] || {
		name: "",
		chosenNumber: null,
	};

	roomState.users[deviceId].chosenNumber = chosenNumber;

	await setRoomState(roomId, roomState);
}

async function getDeviceIdFromName(
	roomId: string,
	name: string,
): Promise<string | null> {
	const roomState = await getRoomStateOrDefault(roomId);
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
			(await getDeviceIdFromName(params.id, parsedName.data)) !== null;
		if (nameAlreadyPresent) {
			return {
				body: "Name already exists",
				status: 400,
			};
		}

		// if there's no devices in the room already, set this device as admin
		const roomState = await getRoomStateOrDefault(params.id);
		if (roomState.adminDeviceId === null) {
			roomState.adminDeviceId = locals.deviceId;
		}
		await setRoomState(params.id, roomState);

		await setNameForRoom(params.id, locals.deviceId, parsedName.data);
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
		const roomState = await getRoomStateOrDefault(params.id);

		roomState.showResults = !roomState.showResults;

		await setRoomState(params.id, roomState);
		return {};
	},
	clear: async ({ params }) => {
		const roomState = await getRoomStateOrDefault(params.id);
		for (const [_, value] of Object.entries(roomState.users)) {
			value.chosenNumber = null;
		}
		roomState.showResults = false;

		await setRoomState(params.id, roomState);
		return {};
	},
} satisfies Actions;

export const load = async ({ params, locals }) => {
	const roomState = await getRoomStateOrDefault(params.id);
	const name = roomState.users[locals.deviceId]?.name;
	return {
		deviceId: locals.deviceId,
		name,
		roomState,
	};
};
