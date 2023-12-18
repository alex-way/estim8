import { DEFAULT_CHOICES } from "$lib/constants";
import { Room } from "$lib/roomState";
import { error, redirect } from "@sveltejs/kit";
import z from "zod";
import type { Actions, PageServerLoad } from "./$types";

const schema = z.array(z.coerce.number().int().positive()).min(2);

export const actions = {
	addChoice: async ({ request, cookies }) => {
		const formData = await request.formData();
		const choicesParam = formData.getAll("choices");

		const parsedChoices = (
			choicesParam
				.map((choice) => {
					const parsed = parseInt(choice.toString());
					if (Number.isNaN(parsed)) return null;
					return parsed;
				})
				.filter((choice) => choice !== null) as number[]
		).sort((a, b) => a - b);

		const choices = new Set(parsedChoices);

		cookies.set("choices", Array.from(choices).join(","), {
			path: "/",
		});

		return { choices };
	},
	removeChoice: async ({ request, cookies }) => {
		const formData = await request.formData();
		const choicesParam = formData.getAll("choices");
		const toRemove = formData.get("toRemove");

		const parsedChoices = (
			choicesParam
				.map((choice) => {
					const parsed = parseInt(choice.toString());
					if (Number.isNaN(parsed)) return null;
					return parsed;
				})
				.filter((choice) => choice !== null) as number[]
		).sort((a, b) => a - b);

		const choices = new Set(parsedChoices);

		if (!toRemove) return choices;

		const parsedToRemove = parseInt(toRemove.toString());
		if (Number.isNaN(parsedToRemove)) return choices;

		choices.delete(parsedToRemove);

		cookies.set("choices", Array.from(choices).join(","), {
			path: "/",
		});

		return { choices };
	},
	createRoom: async ({ request }) => {
		const formData = await request.formData();
		const choices = formData.getAll("choices");

		const parsedChoices = schema.safeParse(choices);
		if (parsedChoices.success === false) {
			return error(400, parsedChoices.error.message);
		}

		const room = await Room.createRoom({ choices: parsedChoices.data });

		return redirect(303, `/room/${room.id}`);
	},
} satisfies Actions;

export const load: PageServerLoad = async ({ cookies }) => {
	const userSpecifiedChoices = cookies.get("choices") || "";
	const parsedChoices = userSpecifiedChoices
		.split(",")
		.map((choice) => {
			const parsed = parseInt(choice);
			if (Number.isNaN(parsed)) return null;
			return parsed;
		})
		.filter((choice) => choice !== null) as number[];

	const choices = parsedChoices.length
		? new Set(parsedChoices)
		: DEFAULT_CHOICES;

	return {
		choices,
	};
};
