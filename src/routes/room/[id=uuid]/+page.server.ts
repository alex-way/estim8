import { pusher } from "$hooks/server";
import { Room } from "$lib/roomState";
import { error, fail } from "@sveltejs/kit";
import z from "zod";
import type { Actions, PageServerLoad } from "./$types";

const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

async function getUsersInRoom(roomId: string): Promise<string[]> {
	const channelName = `presence-cache-${roomId}`;
	const usersResponse = await pusher.get({
		path: `/channels/${channelName}/users`,
	});
	const usersJson: { users: { id: string }[] } = await usersResponse.json();

	return usersJson.users.map((user) => user.id);
}

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
		if (room === null) return fail(404, { body: "That room doesn't exist" });

		const nameAlreadyPresent =
			room.getDeviceIdFromName(parsedName.data) !== null;
		if (nameAlreadyPresent) {
			return fail(400, {
				errors: {
					name: "Name already taken.",
				},
			});
		}

		// Remove all users from the room that aren't in the room anymore
		const usersInRoom = await getUsersInRoom(room.id);
		room.removeUsersNotInRoom(usersInRoom);

		room.setNameForDeviceId(locals.deviceId, parsedName.data);
		await room.save();

		cookies.set("name", parsedName.data, {
			secure: true,
			path: "/",
			sameSite: "lax",
			httpOnly: true,
			expires: new Date(Date.now() + ONE_YEAR),
		});
	},
	submitNumber: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const schema = z.union([z.literal("?"), z.coerce.number()]);

		const parsedNumber = schema.safeParse(formData.get("chosenNumber"));
		if (!parsedNumber.success) {
			return fail(400, {
				body: parsedNumber.error,
			});
		}

		await Room.persistChosenNumberForDeviceId(
			params.id,
			locals.deviceId,
			parsedNumber.data,
		).catch(() => {
			return fail(400, {
				body: "Something went wrong. Please try again later.",
			});
		});
	},
	inverseDisplay: async ({ params }) => {
		const room = await Room.getRoom(params.id);
		if (room === null) return fail(404, { body: "That room doesn't exist" });
		room.invertShowResults();
		await room.save();
	},
	inverseAllowUnknown: async ({ params }) => {
		const room = await Room.getRoom(params.id);
		if (room === null) return fail(404, { body: "That room doesn't exist" });
		room.invertAllowUnknown();
		await room.save();
	},
	inverseSnooping: async ({ params, locals }) => {
		const room = await Room.getRoom(params.id);
		if (room === null) return fail(404, { body: "That room doesn't exist" });
		const isAdmin = room.state.adminDeviceId === locals.deviceId;

		if (!isAdmin) {
			return fail(403, {
				body: "Only the admin can do this",
			});
		}

		room.invertSnooping();
		await room.save();
	},
	inverseParticipation: async ({ request, params, locals }) => {
		const room = await Room.getRoom(params.id);
		if (room === null) return fail(404, { body: "That room doesn't exist" });

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
		if (room === null) return fail(404, { body: "That room doesn't exist" });

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
		if (room === null) return fail(404, { body: "That room doesn't exist" });

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
		if (room === null) return fail(404, { body: "That room doesn't exist" });
		room.clearSelectedNumbers();
		await room.save();
	},
} satisfies Actions;

export const load: PageServerLoad = async ({ params, locals }) => {
	const room = await Room.getRoom(params.id);
	if (room === null) {
		return error(404, {
			message: "That room doesn't exist",
		});
	}

	if (locals.name && room.getDeviceIdFromName(locals.name) === null) {
		room.setNameForDeviceId(locals.deviceId, locals.name);
	}

	if (room.state.adminDeviceId === null) {
		room.setAdmin(locals.deviceId);
	}

	if (room.isModified()) {
		await room.save();
	}

	return {
		deviceId: locals.deviceId,
		name: locals.name,
		roomState: room.state,
	};
};
