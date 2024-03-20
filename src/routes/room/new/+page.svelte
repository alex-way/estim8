<script lang="ts">
	import { enhance } from '$app/forms';
	import { navigating } from '$app/stores';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Plus } from 'lucide-svelte';

	const { data, form } = $props();

	const choices = $derived(form?.choices ?? data.choices);
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
						class="text-center py-6 text-3xl bg-slate-700"
						min={0}
						max={999}
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
				return async ({ update }) => {
					update({ reset: false, invalidateAll: false });
				};
			}}
		>
			{#each choices as choice}
				<input type="hidden" name="choices" value={choice} />
			{/each}
			<Button type="submit" size="lg" class="w-full" disabled={!!$navigating}
				>{!!$navigating ? 'Loading...' : 'Start a new room'}</Button
			>
		</form>
	</div>
</div>
