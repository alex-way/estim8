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
		<div class="flex gap-2 m-2">
			<form action="?/removeChoice" method="post" use:enhance>
				{#each choices as choice}
					<input type="hidden" name="choices" value={choice} />
					<button type="submit" name="toRemove" value={choice}
						><Card reveal={true} revealText={choice.toString()} /></button
					>
				{/each}
			</form>
			<Card reveal={true}>
				<form action="?/addChoice" method="post" class="grid gap-4" use:enhance>
					{#each choices as choice}
						<input type="hidden" name="choices" value={choice} />
					{/each}
					<Input
						type="number"
						name="choices"
						bind:value={newNumber}
						class="text-center py-6 text-3xl bg-slate-700"
						min={0}
						max={999}
						autofocus
						required
					/>
					<Button type="submit" size="lg">+</Button>
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
