import { randomUUID } from "crypto";
import { signJWT, verifyJWT } from "$lib/server/token";
import type { Handle } from "@sveltejs/kit";

const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.name = event.cookies.get("name");

	let jwt = event.cookies.get("deviceId");

	if (!jwt) {
		const deviceId = randomUUID();
		jwt = await signJWT(
			{ sub: deviceId },
			{ exp: new Date(Date.now() + ONE_YEAR) },
		);
		event.cookies.set("deviceId", jwt, {
			secure: true,
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			expires: new Date(Date.now() + ONE_YEAR),
		});
	}

	try {
		const { sub } = await verifyJWT(jwt);

		event.locals.deviceId = sub;
	} catch (error) {
		console.log(error);

		event.cookies.delete("deviceId", {
			secure: true,
			path: "/",
			httpOnly: true,
			sameSite: "lax",
		});
	}
	return resolve(event);
};
