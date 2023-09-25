import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { Room } from "$lib/roomState";

export const load: PageServerLoad = async ({ url }) => {
	const choicesParam = url.searchParams.getAll("choices");

	const parsedChoices = choicesParam
		.map((choice) => {
			const parsed = parseInt(choice);
			if (isNaN(parsed)) return null;
			return parsed;
		})
		.filter((choice) => choice !== null) as number[];
	if (parsedChoices.length < 2) {
		throw error(400, "You must specify at least two choices.");
	}
	const room = await Room.createRoom({ choices: parsedChoices });

	throw redirect(303, `/room/${room.id}`);
};
