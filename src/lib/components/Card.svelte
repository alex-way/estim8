<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { CardBack } from '$lib/types';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = {
		/**The text to show at the top of the card. Usually the name of the participant.*/
		title?: string;
		/**Whether to reveal the text beneath the card. */
		reveal?: boolean;
		/**Whether we're still waiting for the user to select a number. */
		pending?: boolean;
		revealText?: string | number;
		class?: HTMLAttributes<HTMLDivElement>['class'];
		cardBack?: CardBack;
		children?: Snippet;
	};

	const cardBackClasses: Record<CardBack, string> = {
		default: 'bg-secondary',
		red: 'bg-red-900',
		blue: 'bg-blue-900',
		green: 'bg-green-900',
		yellow: 'bg-yellow-700',
		orange: 'bg-orange-700',
		pink: 'bg-pink-800',
		purple: 'bg-purple-950',
		magic: 'bg-linear-to-r from-pink-800 via-red-800 to-yellow-800 background-animate'
	};

	const {
		title = '',
		reveal = false,
		pending = true,
		revealText = '',
		class: className,
		cardBack = 'default',
		children
	}: Props = $props();

	// Limit the length of the title to 8 characters and append an ellipsis if it's longer
	const abbreviatedTitle = $derived(title.length > 10 ? `${title.slice(0, 10)}...` : title);
</script>

<Card.Root class={cn('w-32 h-48 inline-block', className, cardBackClasses[cardBack])} on:click>
	<Card.Header class="px-2">
		<Card.Title class="text-xl text-center" {title}>{abbreviatedTitle}</Card.Title>
	</Card.Header>
	<Card.Content>
		{#if reveal}
			{#if revealText}
				<p class="text-6xl text-center mt-2">{revealText}</p>
			{:else}
				{@render children?.()}
			{/if}
		{:else}
			<Skeleton class={`w-16 h-20 rounded-lg mx-auto bg-primary/20 ${pending ? '' : 'bg-emerald-300'}`} />
		{/if}
	</Card.Content>
</Card.Root>
