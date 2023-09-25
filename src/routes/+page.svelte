<script>
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { DEFAULT_CHOICES } from '$lib/constants';
</script>

<div class="flex justify-center">
	<form action="/room/new" method="get">
		<p class="text-center text-4xl">Selectable Choices</p>
		<div class="flex gap-2 m-2">
			{#each DEFAULT_CHOICES as choice}
				<input type="hidden" name="choices" value={choice} />
				<Card reveal={true}>
					{choice}
				</Card>
			{/each}
			<Card reveal={true}>+</Card>
		</div>
		<Button type="submit" size="lg" class="w-full">Start a new room</Button>
	</form>
</div>
