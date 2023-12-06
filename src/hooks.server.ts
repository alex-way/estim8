import { randomUUID } from "crypto";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	let deviceId = event.cookies.get("deviceId");

	if (!deviceId) {
		deviceId = randomUUID();
		event.cookies.set("deviceId", deviceId, {
			secure: true,
			path: "/",
		});
	}

	event.locals.deviceId = deviceId;

	event.locals.name = event.cookies.get("name");

	return resolve(event);
};
