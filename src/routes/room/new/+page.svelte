<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { FIB_SEQ, SIMPLE_FIB_SEQ } from '$lib/constants';
	import { Plus } from 'lucide-svelte';

	const { data, form } = $props();

	const choices = $derived(form?.choices ?? data.choices);

	let loading = $state(false);

	function areSetsEqual(a: Set<number>, b: Set<number>): boolean {
		return a.size === b.size && [...a].every((value) => b.has(value));
	}
</script>

<div class="flex justify-center align-middle h-full p-4">
	<div>
		<h2 class="text-center text-4xl font-bold">Start a new room</h2>
		<p class="text-center text-gray-100">Click on a number to select it, or click on a selected number to remove it.</p>
		<div class="flex gap-2 py-2">
			<form action="?/addChoice" method="post" class="inline" use:enhance>
				{#each SIMPLE_FIB_SEQ as choice}
					<input type="hidden" name="choices" value={choice} />
				{/each}
				<Button type="submit" size="default" disabled={areSetsEqual(choices, SIMPLE_FIB_SEQ)}
					>Simple fibonacci sequence</Button
				>
			</form>

			<form action="?/addChoice" method="post" class="inline" use:enhance>
				{#each FIB_SEQ as choice}
					<input type="hidden" name="choices" value={choice} />
				{/each}
				<Button type="submit" size="default" disabled={areSetsEqual(choices, FIB_SEQ)}
					>Extended fibonacci sequence</Button
				>
			</form>
		</div>

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
						class="text-center py-6 text-3xl bg-slate-700"
						min={0}
						max={999}
						step={0.5}
						autofocus
						required
					/>
					<Button type="submit" size="lg"><Plus /></Button>
				</form>
			</Card>
		</div>
		<form
			action="?/createRoom"
			method="post"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					update({ reset: false, invalidateAll: false });
				};
			}}
		>
			{#each choices as choice}
				<input type="hidden" name="choices" value={choice} />
			{/each}
			<div class="flex justify-end">
				<Button type="submit" size="lg" disabled={loading || choices.size === 0}
					>{loading ? 'Loading...' : 'Submit'}</Button
				>
			</div>
		</form>
	</div>
</div>
