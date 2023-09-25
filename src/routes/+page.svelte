<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	$: choices = form?.choices ?? data.choices;

	let newNumber = '';
</script>

<div class="flex justify-center">
	<div>
		<p class="text-center text-4xl">Selectable Choices</p>

		<div class="flex gap-2 m-2">
			{#each choices as choice}
				<Card reveal={true} revealText={choice.toString()} />
			{/each}
			<Card reveal={true}>
				<form method="post" class="grid gap-4" use:enhance>
					{#each choices as choice}
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
		<form action="/room/new" method="get">
			{#each choices as choice}
				<input type="hidden" name="choices" value={choice} />
			{/each}
			<Button type="submit" size="lg" class="w-full">Start a new room</Button>
		</form>
	</div>
</div>
