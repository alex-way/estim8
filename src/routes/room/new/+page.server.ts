import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { Room } from "$lib/roomState";
import z from "zod";

const schema = z.array(z.coerce.number().int().positive()).min(2);

export const load: PageServerLoad = async ({ url }) => {
	const parsedChoices = schema.safeParse(url.searchParams.getAll("choices"));
	if (parsedChoices.success === false) {
		throw error(400, parsedChoices.error.message);
	}
	const room = await Room.createRoom({ choices: parsedChoices.data });

	throw redirect(303, `/room/${room.id}`);
};
