import { pusher } from "$hooks/server";
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

	const user: Pusher.UserChannelData = {
		id: locals.deviceId,
		user_info: {},
	};

	const auth = pusher.authenticateUser(socket_id.toString(), user);
	return json(auth, { status: 200 });
};
