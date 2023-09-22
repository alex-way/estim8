<script lang="ts">
	import type { RoomState } from '$lib/roomState';
	import * as Card from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import Context from './Context.svelte';

	export let roomState: RoomState;

	export let deviceId: string;

	$: participants = Object.values(roomState.users).filter((user) => user.isParticipant);

	$: countOfParticipantsVoted = participants.filter((user) => user.chosenNumber !== null).length;

	$: isObserving = roomState.users[deviceId].isParticipant === false;

	type Result = {
		number: number;
		count: number;
		percentage: number;
	};

	let results: Result[];
	$: results = Object.values(roomState.users).reduce<Result[]>((acc, user) => {
		if (user.chosenNumber === null) {
			return acc;
		}

		const existingResult = acc.find((result) => result.number === user.chosenNumber);

		if (existingResult) {
			existingResult.count++;
		} else {
			acc.push({
				number: user.chosenNumber,
				count: 1,
				percentage: 0
			});
		}

		return acc;
	}, []);
	$: results = results
		.map((result) => ({
			...result,
			percentage: Math.round((result.count / countOfParticipantsVoted) * 100)
		}))
		.sort((a, b) => b.count - a.count);
</script>

<div class="flex gap-4 justify-evenly my-16">
	{#each participants as user (user.deviceId)}
		<Context currentUserDeviceId={deviceId} adminDeviceId={roomState.adminDeviceId || ''} {user}>
			<Card.Root class="bg-secondary w-32 h-48">
				<Card.Header>
					<Card.Title class="text-xl text-center">{user.name}</Card.Title>
				</Card.Header>
				<Card.Content>
					{#if roomState.showResults || (roomState.config.allowObserversToSnoop && isObserving && user.chosenNumber !== null)}
						<p class="text-6xl text-center mt-2">
							{user.chosenNumber || ''}
						</p>
					{:else}
						<Skeleton
							class={`w-16 h-20 rounded-lg mx-auto bg-primary/20 ${user.chosenNumber !== null ? 'bg-emerald-300' : ''}`}
						/>
					{/if}
				</Card.Content>
			</Card.Root>
		</Context>
	{/each}
</div>

{#if roomState.showResults}
	<div class="max-w-2xl mx-auto">
		<h2 class="text-2xl">Results</h2>
		<div class="grid grid-cols-12 gap-2">
			{#if roomState.showResults}
				{#each results as result}
					<div class="col-span-10">
						<Progress value={result.percentage} class="h-2 inline-block" />
					</div>
					<div class="col-span-2">
						<p class="text-lg font-semibold text-center">
							{result.number} <small class="text-xs">({result.count} vote{result.count > 1 ? 's' : ''})</small>
						</p>
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}
