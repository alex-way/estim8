import { pusher } from "$lib/roomState/index";
import { json } from "@sveltejs/kit";
import type Pusher from "pusher";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
	const form = await request.formData();

	const socket_id = form.get("socket_id");

	if (!socket_id) {
		return json(
			{ error: "socket_id is required" },
			{
				status: 400,
			},
		);
	}

	const channel_name = form.get("channel_name");

	if (!channel_name) {
		return json(
			{ error: "channel_name is required" },
			{
				status: 400,
			},
		);
	}

	const presenceData: Pusher.PresenceChannelData = {
		user_id: locals.deviceId,
		user_info: {
			name: locals.name,
		},
	};

	const auth = pusher.authorizeChannel(
		socket_id.toString(),
		channel_name.toString(),
		presenceData,
	);
	return json(auth, { status: 200 });
};
