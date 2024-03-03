import { pusher } from "$hooks/server";
import { getChannelName } from "$lib/constants";
import { Room } from "$lib/roomState";
import { error, fail } from "@sveltejs/kit";
import z from "zod";
import type { Actions, PageServerLoad } from "./$types";

const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

/**
 * Gets a list of user IDs from the presence channel
 */
async function getUsersInRoom(roomId: string): Promise<string[]> {
	const channelName = getChannelName(roomId);
	const usersResponse = await pusher.get({
		path: `/channels/${channelName}/users`,
	});
	const usersJson: { users: { id: string }[] } = await usersResponse.json();

	return usersJson.users.map((user) => user.id);
}

async function trigger(
	roomId: string,
	eventName: string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	data: Record<string, any>,
) {
	const channelName = getChannelName(roomId);
	return pusher.trigger(channelName, eventName, data);
}

function isAdmin(room: Room, locals: { deviceId: string }) {
	return room.state.adminDeviceId === locals.deviceId;
}

async function getRoomOr404(roomId: string): Promise<Room> {
	const room = await Room.getRoom(roomId);
	if (room === null)
		return error(404, {
			message: "That room doesn't exist",
		});
	return room;
}

export const actions = {
	setName: async ({ request, locals, params, cookies }) => {
		const room = await getRoomOr404(params.id);

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

		trigger(params.id, "user:update-choice", {
			id: locals.deviceId,
			choice: parsedNumber.data,
		});

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
	reveal: async ({ params }) => {
		const room = await getRoomOr404(params.id);

		if (room.state.showResults) return;

		room.invertShowResults();

		const usersInRoom = await getUsersInRoom(room.id);

		const activeUsers = Object.values(room.state.users).filter(
			(user) => user.isParticipant && usersInRoom.includes(user.deviceId),
		);

		const consensusAchieved = activeUsers.every(
			(user) => user.choice === activeUsers[0]?.choice,
		);

		trigger(params.id, "room:reveal", {});

		if (consensusAchieved) {
			trigger(params.id, "show-confetti", {});
		}
		await room.save(false);
	},
	inverseAllowUnknown: async ({ params }) => {
		const room = await getRoomOr404(params.id);

		room.invertAllowUnknown();
		await room.save();
	},
	inverseSnooping: async ({ params, locals }) => {
		const room = await getRoomOr404(params.id);

		if (!isAdmin(room, locals))
			return fail(403, {
				body: "Only the admin can do this",
			});

		room.invertSnooping();
		await room.save();
	},
	inverseParticipation: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		const formData = await request.formData();
		const schema = z.string();

		const formDeviceId = formData.get("deviceId");

		const isOwnDevice = locals.deviceId === formDeviceId;
		if (!isAdmin(room, locals) && !isOwnDevice)
			return fail(403, {
				body: "Only the admin can do this",
			});

		const parsedDeviceId = schema.safeParse(formDeviceId);
		if (!parsedDeviceId.success)
			return fail(400, {
				body: parsedDeviceId.error.toString(),
			});

		room.inverseUserParticipation(parsedDeviceId.data);
		await room.save();
	},
	removeUserFromRoom: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		const formData = await request.formData();
		const schema = z.string();

		const formDeviceId = formData.get("deviceId");

		if (!isAdmin(room, locals))
			return fail(403, {
				body: "Only the admin can do this",
			});

		const parsedDeviceId = schema.safeParse(formDeviceId);
		if (!parsedDeviceId.success)
			return fail(400, {
				body: parsedDeviceId.error.toString(),
			});

		const isAdminBeingRemoved = room.state.adminDeviceId === formDeviceId;

		if (isAdminBeingRemoved)
			return fail(403, {
				body: "The admin cannot be removed",
			});

		room.removeUser(parsedDeviceId.data);

		await room.save();
	},
	setAdmin: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		const formData = await request.formData();
		const schema = z.string();

		const formDeviceId = formData.get("deviceId");

		if (!isAdmin(room, locals))
			return fail(403, {
				body: "Only the admin can do this",
			});

		const parsedDeviceId = schema.safeParse(formDeviceId);
		if (!parsedDeviceId.success)
			return fail(400, {
				body: parsedDeviceId.error.toString(),
			});

		room.setAdmin(parsedDeviceId.data);

		await room.save();
	},
	clear: async ({ params }) => {
		const room = await getRoomOr404(params.id);

		room.clearSelectedNumbers();
		await room.save();
		trigger(params.id, "room:clear", {});
	},
	addChoice: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		if (!isAdmin(room, locals))
			return fail(403, {
				body: "Only the admin can do this",
			});

		const formData = await request.formData();
		const schema = z.coerce.number();

		const parsedChoice = schema.safeParse(formData.get("choice"));
		if (!parsedChoice.success) {
			return fail(400, {
				body: parsedChoice.error.toString(),
			});
		}

		room.updateSelectableNumbers([
			...room.state.config.selectableNumbers,
			parsedChoice.data,
		]);
		await room.save();
	},
	removeChoice: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		if (!isAdmin(room, locals))
			return fail(403, {
				body: "Only the admin can do this",
			});

		const formData = await request.formData();
		const schema = z.coerce.number();

		const parsedChoice = schema.safeParse(formData.get("choice"));
		if (!parsedChoice.success) {
			return fail(400, {
				body: parsedChoice.error.toString(),
			});
		}

		room.updateSelectableNumbers(
			room.state.config.selectableNumbers.filter(
				(choice) => choice !== parsedChoice.data,
			),
		);
		await room.save();
	},
	setCardBack: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		const formData = await request.formData();
		const schema = z.union([
			z.literal("default"),
			z.literal("red"),
			z.literal("blue"),
			z.literal("green"),
			z.literal("yellow"),
			z.literal("magic"),
		]);

		const parsedCardBack = schema.safeParse(formData.get("cardBack"));
		if (!parsedCardBack.success) {
			return fail(400, {
				body: parsedCardBack.error.toString(),
			});
		}

		room.setCardBackForDeviceId(locals.deviceId, parsedCardBack.data);
		trigger(params.id, "user:update-card-back", {
			id: locals.deviceId,
			cardBack: parsedCardBack.data,
		});
		await room.save(false);
	},
} satisfies Actions;

export const load: PageServerLoad = async ({ params, locals }) => {
	const room = await Room.getRoom(params.id);
	if (room === null)
		return error(404, {
			message: "That room doesn't exist",
		});

	if (locals.name && room.getDeviceIdFromName(locals.name) === null) {
		room.setNameForDeviceId(locals.deviceId, locals.name);
	}

	const usersInRoom = await getUsersInRoom(room.id);

	const isOnlyUserInRoom =
		usersInRoom.length === 0 ||
		(usersInRoom.length === 1 && usersInRoom[0] === locals.deviceId);

	if (room.state.adminDeviceId === null || isOnlyUserInRoom) {
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
