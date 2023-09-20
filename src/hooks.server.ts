import type { Handle } from "@sveltejs/kit";
import { randomUUID } from "crypto";

export const handle: Handle = async ({ event, resolve }) => {
	let deviceId = event.cookies.get("deviceId");

	if (!deviceId) {
		deviceId = randomUUID();
		event.cookies.set("deviceId", deviceId, {
			secure: true,
		});
	}

	event.locals.deviceId = deviceId;

	const response = await resolve(event);

	return response;
};
