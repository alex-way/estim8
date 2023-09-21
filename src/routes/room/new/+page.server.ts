import { redirect } from "@sveltejs/kit";
import { randomUUID } from "crypto";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
	const random = randomUUID();

	throw redirect(303, `/room/${random}`);
};
