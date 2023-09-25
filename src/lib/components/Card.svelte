<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	/**The text to show at the top of the card. Usually the name of the participant.*/
	export let title: string = '';
	/**Whether to reveal the text beneath the card. */
	export let reveal = false;
	/**Whether we're still waiting for the user to select a number. */
	export let pending = true;

	export let revealText: string = '';

	type $$Props = {
		class?: HTMLAttributes<HTMLDivElement>['class'];
		title?: string;
		reveal?: boolean;
		pending?: boolean;
		revealText?: string;
	};

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<Card.Root class={cn('bg-secondary w-32 h-48 inline-block', className)} on:click>
	<Card.Header>
		<Card.Title class="text-xl text-center">{title}</Card.Title>
	</Card.Header>
	<Card.Content>
		{#if reveal}
			{#if revealText}
				<p class="text-6xl text-center mt-2">{revealText}</p>
			{:else}
				<slot />
			{/if}
		{:else}
			<Skeleton class={`w-16 h-20 rounded-lg mx-auto bg-primary/20 ${pending ? '' : 'bg-emerald-300'}`} />
		{/if}
	</Card.Content>
</Card.Root>
