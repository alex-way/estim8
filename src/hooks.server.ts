import { randomUUID } from "crypto";
import type { Handle } from "@sveltejs/kit";

const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

export const handle: Handle = async ({ event, resolve }) => {
	let deviceId = event.cookies.get("deviceId");

	if (!deviceId) {
		deviceId = randomUUID();
		event.cookies.set("deviceId", deviceId, {
			secure: true,
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			expires: new Date(Date.now() + ONE_YEAR),
		});
	}

	event.locals.deviceId = deviceId;

	event.locals.name = event.cookies.get("name");

	return resolve(event);
};
