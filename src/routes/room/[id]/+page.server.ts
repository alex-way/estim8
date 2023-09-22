import type { Actions } from "./$types";
import z from "zod";
import { Room } from "$lib/roomState";

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

		const room = await Room.getRoom(params.id);

		const nameAlreadyPresent =
			room.getDeviceIdFromName(parsedName.data) !== null;
		if (nameAlreadyPresent) {
			return {
				body: "Name already exists",
				status: 400,
			};
		}

		if (room.state.adminDeviceId === null) {
			room.state.adminDeviceId = locals.deviceId;
		}

		room.setNameForDeviceId(locals.deviceId, parsedName.data);

		await room.save();

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

		const room = await Room.getRoom(params.id);
		room.setChosenNumberForDeviceId(locals.deviceId, parsedNumber.data);
		await room.save();
		return {};
	},
	inverseDisplay: async ({ params }) => {
		const room = await Room.getRoom(params.id);

		room.invertShowResults();

		await room.save();

		return {};
	},
	clear: async ({ params }) => {
		const room = await Room.getRoom(params.id);
		room.clearSelectedNumbers();
		room.save();
		return {};
	},
} satisfies Actions;

export const load = async ({ params, locals }) => {
	const room = await Room.getRoom(params.id);

	const name = room.state.users[locals.deviceId]?.name;
	return {
		deviceId: locals.deviceId,
		name,
		roomState: room.state,
	};
};
