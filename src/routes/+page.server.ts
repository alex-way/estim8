import type { Actions, PageServerLoad } from "./$types";
import { DEFAULT_CHOICES } from "$lib/constants";

export const actions = {
	addChoice: async ({ request, cookies }) => {
		const formData = await request.formData();
		const choicesParam = formData.getAll("choices");

		const parsedChoices = (
			choicesParam
				.map((choice) => {
					const parsed = parseInt(choice.toString());
					if (isNaN(parsed)) return null;
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
					if (isNaN(parsed)) return null;
					return parsed;
				})
				.filter((choice) => choice !== null) as number[]
		).sort((a, b) => a - b);

		const choices = new Set(parsedChoices);

		if (!toRemove) return choices;

		const parsedToRemove = parseInt(toRemove.toString());
		if (isNaN(parsedToRemove)) return choices;

		choices.delete(parsedToRemove);

		cookies.set("choices", Array.from(choices).join(","), {
			path: "/",
		});

		return { choices };
	},
} satisfies Actions;

export const load: PageServerLoad = async ({ cookies }) => {
	const userSpecifiedChoices = cookies.get("choices") || "";
	const parsedChoices = userSpecifiedChoices
		.split(",")
		.map((choice) => {
			const parsed = parseInt(choice);
			if (isNaN(parsed)) return null;
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