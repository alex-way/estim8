import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { randomUUID } from "crypto";

export const GET: RequestHandler = () => {
	const random = randomUUID();

	throw redirect(303, `/room/${random}`);
};
