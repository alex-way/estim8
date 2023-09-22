import type { Actions } from "./$types";
import z from "zod";
import { Room, type RoomState } from "$lib/roomState";
import { fail } from "@sveltejs/kit";

export const actions = {
	setName: async ({ request, locals, params, cookies }) => {
		const formData = await request.formData();

		const schema = z.string();

		const parsedName = schema.safeParse(formData.get("name"));
		if (!parsedName.success) {
			return fail(400, {
				errors: {
					name: "Name is required",
				},
			});
		}

		const room = await Room.getRoom(params.id);

		const nameAlreadyPresent =
			room.getDeviceIdFromName(parsedName.data) !== null;
		if (nameAlreadyPresent) {
			return fail(400, {
				errors: {
					name: "Name already taken.",
				},
			});
		}

		room.setNameForDeviceId(locals.deviceId, parsedName.data);

		await room.save();

		cookies.set("name", parsedName.data);
	},
	submitNumber: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const schema = z.coerce.number();

		const parsedNumber = schema.safeParse(formData.get("chosenNumber"));
		if (!parsedNumber.success) {
			return fail(400, {
				body: parsedNumber.error,
			});
		}

		const room = await Room.getRoom(params.id);
		room.setChosenNumberForDeviceId(locals.deviceId, parsedNumber.data);
		await room.save();
	},
	inverseDisplay: async ({ params }) => {
		const room = await Room.getRoom(params.id);
		room.invertShowResults();
		await room.save();
	},
	inverseParticipation: async ({ request, params, locals }) => {
		const room = await Room.getRoom(params.id);

		const formData = await request.formData();
		const schema = z.string();

		const formDeviceId = formData.get("deviceId");

		const isAdmin = room.state.adminDeviceId === locals.deviceId;
		const isOwnDevice = locals.deviceId === formDeviceId;
		if (!isAdmin && !isOwnDevice) {
			return fail(403, {
				body: "Only the admin can do this",
			});
		}
		const parsedDeviceId = schema.safeParse(formDeviceId);
		if (!parsedDeviceId.success) {
			return fail(400, {
				body: parsedDeviceId.error.toString(),
			});
		}

		room.inverseUserParticipation(parsedDeviceId.data);
		await room.save();
	},
	removeUserFromRoom: async ({ request, params, locals }) => {
		const room = await Room.getRoom(params.id);

		const formData = await request.formData();
		const schema = z.string();

		const formDeviceId = formData.get("deviceId");

		const isAdmin = room.state.adminDeviceId === locals.deviceId;

		if (!isAdmin) {
			return fail(403, {
				body: "Only the admin can do this",
			});
		}

		const parsedDeviceId = schema.safeParse(formDeviceId);
		if (!parsedDeviceId.success) {
			return fail(400, {
				body: parsedDeviceId.error.toString(),
			});
		}

		const isAdminBeingRemoved = room.state.adminDeviceId === formDeviceId;

		if (isAdminBeingRemoved) {
			return fail(403, {
				body: "The admin cannot be removed",
			});
		}

		room.removeUser(parsedDeviceId.data);

		await room.save();
	},
	setAdmin: async ({ request, params, locals }) => {
		const room = await Room.getRoom(params.id);

		const formData = await request.formData();
		const schema = z.string();

		const formDeviceId = formData.get("deviceId");

		const isAdmin = room.state.adminDeviceId === locals.deviceId;

		if (!isAdmin) {
			return fail(403, {
				body: "Only the admin can do this",
			});
		}

		const parsedDeviceId = schema.safeParse(formDeviceId);
		if (!parsedDeviceId.success) {
			return fail(400, {
				body: parsedDeviceId.error.toString(),
			});
		}

		room.setAdmin(parsedDeviceId.data);

		await room.save();
	},
	clear: async ({ params }) => {
		const room = await Room.getRoom(params.id);
		room.clearSelectedNumbers();
		await room.save();
	},
} satisfies Actions;

export const load = async ({ params, locals }) => {
	const room = await Room.getRoom(params.id);

	if (locals.name && room.getDeviceIdFromName(locals.name) === null) {
		room.setNameForDeviceId(locals.deviceId, locals.name);
	}

	if (room.state.adminDeviceId === null) {
		room.setAdmin(locals.deviceId);
	}

	if (room.isModified()) await room.save();

	return {
		deviceId: locals.deviceId,
		name: locals.name,
		roomState: JSON.parse(JSON.stringify(room.state)) as RoomState,
	};
};
