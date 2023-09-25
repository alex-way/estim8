<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { DEFAULT_CHOICES } from '$lib/constants';
	import Input from '$lib/components/ui/input/input.svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	const choicesParam = $page.url.searchParams.getAll('choices');

	const parsedChoices = choicesParam
		.map((choice) => {
			const parsed = parseInt(choice);
			if (isNaN(parsed)) return null;
			return parsed;
		})
		.filter((choice) => choice !== null) as number[];

	let choices = parsedChoices.length ? new Set(parsedChoices) : new Set(DEFAULT_CHOICES);
	$: sortedChoices = [...choices].sort((a, b) => a - b);

	let newNumber = '';
</script>

<div class="flex justify-center">
	<div>
		<p class="text-center text-4xl">Selectable Choices</p>

		<div class="flex gap-2 m-2">
			{#each sortedChoices as choice}
				<Card reveal={true} revealText={choice.toString()} />
			{/each}
			<Card reveal={true}>
				<form method="get" class="grid gap-4" use:enhance>
					{#each sortedChoices as choice}
						<input type="hidden" name="choices" value={choice} />
					{/each}
					<Input
						type="number"
						name="choices"
						bind:value={newNumber}
						class="text-center text-2xl"
						min={0}
						max={999}
						required
					/>
					<Button type="submit">+</Button>
				</form>
			</Card>
		</div>
		<form action="/room/new" method="get" use:enhance>
			{#each sortedChoices as choice}
				<input type="hidden" name="choices" value={choice} />
			{/each}
			<Button type="submit" size="lg" class="w-full">Start a new room</Button>
		</form>
	</div>
</div>
