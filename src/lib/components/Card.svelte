<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';

	type Props = {
		/**The text to show at the top of the card. Usually the name of the participant.*/
		title?: string;
		/**Whether to reveal the text beneath the card. */
		reveal?: boolean;
		/**Whether we're still waiting for the user to select a number. */
		pending?: boolean;
		revealText?: string | number;
		class?: HTMLAttributes<HTMLDivElement>['class'];
	};

	let { title = '', reveal = false, pending = true, revealText = '', class: className } = $props<Props>();
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
