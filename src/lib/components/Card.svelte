<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';

	/**The text to show at the top of the card. Usually the name of the participant.*/
	export let title: string;
	/**Whether to reveal the text beneath the card. */
	export let reveal = false;
	/**Whether we're still waiting for the user to select a number. */
	export let pending = true;
</script>

<Card.Root class="bg-secondary w-32 h-48">
	<Card.Header>
		<Card.Title class="text-xl text-center">{title}</Card.Title>
	</Card.Header>
	<Card.Content>
		{#if reveal}
			<p class="text-6xl text-center mt-2"><slot /></p>
		{:else}
			<Skeleton class={`w-16 h-20 rounded-lg mx-auto bg-primary/20 ${pending ? '' : 'bg-emerald-300'}`} />
		{/if}
	</Card.Content>
</Card.Root>
