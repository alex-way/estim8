import type { RoomState } from "$/lib/types";
import { pusher } from "$hooks/server";
import { getChannelName } from "$lib/constants";
import { DBUser, Room } from "$lib/roomState";
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

function isRoomAdmin(room: RoomState, locals: { deviceId: string }) {
	return room.adminDeviceId === locals.deviceId;
}

async function getRoomOr404(roomId: string): Promise<RoomState> {
	const room = await new Room(roomId).getRoom();
	if (room === null)
		return error(404, {
			message: "That room doesn't exist",
		});
	return room;
}

async function isAdminInRoom(room: RoomState): Promise<boolean> {
	const usersInRoom = await getUsersInRoom(room.id);
	return !!room.adminDeviceId && usersInRoom.includes(room.adminDeviceId);
}

export const actions = {
	setName: async ({ request, locals, params, cookies }) => {
		const formData = await request.formData();

		const parsedName = z.string().safeParse(formData.get("name"));
		if (!parsedName.success) {
			return fail(400, {
				errors: {
					name: "Name is required",
				},
			});
		}
		await Promise.all([
			new DBUser(locals.deviceId).setName(parsedName.data),
			trigger(params.id, "user:set-name", {
				id: locals.deviceId,
				name: parsedName.data,
			}),
		]);

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

		const parsedNumber = z.union([z.literal("?"), z.coerce.number()]).safeParse(formData.get("chosenNumber"));
		if (!parsedNumber.success) {
			return fail(400, {
				body: parsedNumber.error,
			});
		}

		await Promise.all([
			new Room(params.id).setChoiceForDeviceId(locals.deviceId, parsedNumber.data).catch(() => {
				return fail(400, {
					body: "Something went wrong. Please try again later.",
				});
			}),
			trigger(params.id, "user:update-choice", {
				id: locals.deviceId,
				choice: parsedNumber.data,
			}),
		]);
	},
	reveal: async ({ params }) => {
		await Promise.all([
			new Room(params.id).reveal().catch(() => {
				return fail(400, {
					body: "Something went wrong. Please try again later.",
				});
			}),
			trigger(params.id, "room:reveal", {}),
		]);
	},
	setAllowUnknown: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		if (!isRoomAdmin(room, locals))
			return fail(403, {
				body: "Only the admin can do this",
			});

		const formData = await request.formData();

		const parsedAllowUnknown = z.coerce.boolean().safeParse(formData.get("allowUnknown"));
		if (!parsedAllowUnknown.success) {
			return fail(400, {
				body: parsedAllowUnknown.error.toString(),
			});
		}

		await Promise.all([
			new Room(params.id).setAllowUnknown(parsedAllowUnknown.data),
			trigger(params.id, "room:update-allow-unknown", {
				allowUnknown: parsedAllowUnknown.data,
			}),
		]);
	},
	setAllowSnooping: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		if (!isRoomAdmin(room, locals))
			return fail(403, {
				body: "Only the admin can do this",
			});

		const formData = await request.formData();

		const parsedAllowSnooping = z.coerce.boolean().safeParse(formData.get("allowSnooping"));
		if (!parsedAllowSnooping.success) {
			return fail(400, {
				body: parsedAllowSnooping.error.toString(),
			});
		}

		await Promise.all([
			new Room(params.id).setAllowSnooping(parsedAllowSnooping.data),
			trigger(params.id, "room:update-allow-snooping", {
				allowSnooping: parsedAllowSnooping.data,
			}),
		]);
	},

	setParticipation: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		const formData = await request.formData();

		const formDeviceId = formData.get("deviceId");
		const participating = formData.get("participating");

		const isOwnDevice = locals.deviceId === formDeviceId;
		if (!isRoomAdmin(room, locals) && !isOwnDevice)
			return fail(403, {
				body: "Only the admin can do this",
			});

		const parsedDeviceId = z.string().safeParse(formDeviceId);
		if (!parsedDeviceId.success)
			return fail(400, {
				body: parsedDeviceId.error.toString(),
			});

		const parsedParticipating = z.coerce.boolean().safeParse(participating);
		if (!parsedParticipating.success)
			return fail(400, {
				body: parsedParticipating.error.toString(),
			});

		await Promise.all([
			new Room(params.id).setParticipation(parsedDeviceId.data, parsedParticipating.data),
			trigger(params.id, "user:update-participation", {
				id: locals.deviceId,
				participating: parsedParticipating.data,
			}),
		]);
	},
	removeUserFromRoom: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		const formData = await request.formData();
		const formDeviceId = formData.get("deviceId");

		if (!isRoomAdmin(room, locals))
			return fail(403, {
				body: "Only the admin can do this",
			});

		const parsedDeviceId = z.string().safeParse(formDeviceId);
		if (!parsedDeviceId.success)
			return fail(400, {
				body: parsedDeviceId.error.toString(),
			});

		const isAdminBeingRemoved = room.adminDeviceId === formDeviceId;

		if (isAdminBeingRemoved)
			return fail(403, {
				body: "The admin cannot be removed",
			});

		await Promise.all([
			new Room(params.id).removeUser(parsedDeviceId.data),
			trigger(params.id, "user:remove", { id: parsedDeviceId.data }),
		]);
	},

	setAdmin: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		const formData = await request.formData();
		const formDeviceId = formData.get("deviceId");

		if (!isRoomAdmin(room, locals))
			return fail(403, {
				body: "Only the admin can do this",
			});

		const parsedDeviceId = z.string().safeParse(formDeviceId);
		if (!parsedDeviceId.success)
			return fail(400, {
				body: parsedDeviceId.error.toString(),
			});

		return Promise.all([
			new Room(params.id).setAdmin(parsedDeviceId.data),
			trigger(params.id, "room:set-admin", {
				adminDeviceId: parsedDeviceId.data,
			}),
		]);
	},
	clear: async ({ params }) => {
		await Promise.all([
			new Room(params.id).clearChoices().catch(() => {
				return fail(400, {
					body: "Something went wrong. Please try again later.",
				});
			}),
			trigger(params.id, "room:clear", {}),
		]);
	},
	addChoice: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		if (!isRoomAdmin(room, locals))
			return fail(403, {
				body: "Only the admin can do this",
			});

		const formData = await request.formData();

		const parsedChoice = z.coerce.number().safeParse(formData.get("choice"));
		if (!parsedChoice.success) {
			return fail(400, {
				body: parsedChoice.error.toString(),
			});
		}

		const existingChoice = room.config.selectableNumbers.includes(parsedChoice.data);

		if (existingChoice)
			return fail(400, {
				body: "This choice is already in the list",
			});

		const newChoices = [...room.config.selectableNumbers, parsedChoice.data].sort((a, b) => a - b);
		await Promise.all([
			new Room(params.id).setChoices(newChoices),
			trigger(params.id, "room:update-selectable-numbers", {
				selectableNumbers: newChoices,
			}),
		]);
	},
	removeChoice: async ({ request, params, locals }) => {
		const room = await getRoomOr404(params.id);

		if (!isRoomAdmin(room, locals))
			return fail(403, {
				body: "Only the admin can do this",
			});

		const formData = await request.formData();

		const parsedChoice = z.coerce.number().safeParse(formData.get("choice"));
		if (!parsedChoice.success) {
			return fail(400, {
				body: parsedChoice.error.toString(),
			});
		}
		const existingChoice = room.config.selectableNumbers.includes(parsedChoice.data);

		if (!existingChoice)
			return fail(400, {
				body: "This choice is not in the list",
			});

		const newChoices = room.config.selectableNumbers.filter((choice) => choice !== parsedChoice.data);
		await Promise.all([
			new Room(params.id).setChoices(newChoices),
			trigger(params.id, "room:update-selectable-numbers", {
				selectableNumbers: newChoices,
			}),
		]);
	},
	setCardBack: async ({ request, params, locals }) => {
		const formData = await request.formData();

		const parsedCardBack = z
			.union([
				z.literal("default"),
				z.literal("red"),
				z.literal("blue"),
				z.literal("green"),
				z.literal("yellow"),
				z.literal("pink"),
				z.literal("purple"),
				z.literal("magic"),
			])
			.safeParse(formData.get("cardBack"));
		if (!parsedCardBack.success) {
			return fail(400, {
				body: parsedCardBack.error.toString(),
			});
		}

		await Promise.all([
			new DBUser(locals.deviceId).setCardBack(parsedCardBack.data),
			trigger(params.id, "user:update-card-back", {
				id: locals.deviceId,
				cardBack: parsedCardBack.data,
			}),
		]);
	},
	claimAdmin: async ({ params, locals }) => {
		const room = await getRoomOr404(params.id);

		const shouldSetAdmin = room.adminDeviceId === null || !(await isAdminInRoom(room));

		if (!shouldSetAdmin) return;

		await Promise.all([
			new Room(params.id).setAdmin(locals.deviceId),
			trigger(params.id, "room:set-admin", {
				adminDeviceId: locals.deviceId,
			}),
		]);
	},
} satisfies Actions;

// todo: optimise loading so we don't send 3 separate requests to DB every time
export const load: PageServerLoad = async ({ params, locals }) => {
	let room = await getRoomOr404(params.id);

	const usersInRoom = await getUsersInRoom(room.id);

	const isOnlyUserInRoom = usersInRoom.length === 0 || (usersInRoom.length === 1 && usersInRoom[0] === locals.deviceId);

	if (room.adminDeviceId !== locals.deviceId && isOnlyUserInRoom) {
		await new Room(params.id).setAdmin(locals.deviceId);
	}

	const inRoomAlready = room.users[locals.deviceId] !== undefined;
	if (!inRoomAlready) {
		await new Room(params.id).addUser(locals.deviceId);
		room = await getRoomOr404(params.id);
		await trigger(params.id, "user:add", room.users[locals.deviceId]);
	}

	return {
		deviceId: locals.deviceId,
		name: locals.name,
		roomState: room,
	};
};
