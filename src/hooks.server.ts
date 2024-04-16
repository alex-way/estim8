import { randomUUID } from "node:crypto";
import { dev } from "$app/environment";
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { signJWT, verifyJWT } from "$lib/server/token";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import Pusher from "pusher";

const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

if (!privateEnv.PUSHER_APP_ID) {
	throw new Error("Missing PUSHER_APP_ID");
}
if (!privateEnv.PUSHER_SECRET) {
	throw new Error("Missing PUSHER_SECRET");
}
if (!publicEnv.PUBLIC_PUSHER_APP_KEY) {
	throw new Error("Missing PUBLIC_PUSHER_APP_KEY");
}

export const pusher = new Pusher({
	appId: privateEnv.PUSHER_APP_ID,
	key: publicEnv.PUBLIC_PUSHER_APP_KEY,
	secret: privateEnv.PUSHER_SECRET,
	cluster: "eu",
	useTLS: true,
});

export const handleCookies: Handle = async ({ event, resolve }) => {
	event.locals.name = event.cookies.get("name");

	let jwt = event.cookies.get("deviceId");

	if (!jwt) {
		const deviceId = randomUUID();
		jwt = await signJWT({ sub: deviceId }, { exp: new Date(Date.now() + ONE_YEAR) });
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
		console.error(error);

		event.cookies.delete("deviceId", {
			secure: true,
			path: "/",
			httpOnly: true,
			sameSite: "lax",
		});
	}
	return resolve(event);
};

const handleInternalRoutes: Handle = async ({ event, resolve }) => {
	if (dev && event.request.url.includes("/_internal/")) {
		return new Response("Not found", { status: 404 });
	}
	return resolve(event);
};

export const handle = sequence(handleInternalRoutes, handleCookies);
