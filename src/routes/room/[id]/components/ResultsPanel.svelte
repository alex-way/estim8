<script lang="ts">
	import type { RoomState } from '../types';
	import * as Card from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';

	export let roomState: RoomState;

	$: countOfParticipants = Object.keys(roomState.users).length;
	$: countOfParticipantsVoted = Object.keys(roomState.users).filter(
		(deviceId) => roomState.users[deviceId].chosenNumber !== null
	).length;
	$: countOfParticipantsNotVoted = countOfParticipants - countOfParticipantsVoted;
</script>

<div class="flex gap-4 justify-evenly my-4 px-4">
	{#if roomState}
		{#each Object.keys(roomState.users) as deviceId (deviceId)}
			<Card.Root class="bg-secondary min-w-[100px]">
				<Card.Header>
					<Card.Title class="text-xl text-center">{roomState.users[deviceId].name}</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-3xl text-center">
						{#if roomState.showResults}
							{roomState.users[deviceId].chosenNumber || '?'}
						{:else}
							<Skeleton class="w-[48px] h-[36px] rounded-lg mx-auto bg-primary/20" />
						{/if}
					</p>
				</Card.Content>
			</Card.Root>
		{/each}
	{/if}
</div>
