<script lang="ts">
	import type { RoomState } from '$lib/roomState';
	import * as Card from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import Progress from '$lib/components/ui/progress/progress.svelte';

	export let roomState: RoomState;

	$: countOfParticipants = Object.keys(roomState.users).length;
	$: countOfParticipantsVoted = Object.keys(roomState.users).filter(
		(deviceId) => roomState.users[deviceId].chosenNumber !== null
	).length;
	$: countOfParticipantsNotVoted = countOfParticipants - countOfParticipantsVoted;

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

<div class="flex gap-4 justify-evenly my-16 px-4">
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
						<Skeleton
							class={`w-[48px] h-[36px] rounded-lg mx-auto bg-primary/20 ${
								roomState.users[deviceId].chosenNumber != null && 'bg-emerald-300'
							}`}
						/>
					{/if}
				</p>
			</Card.Content>
		</Card.Root>
	{/each}
</div>

{#if roomState.showResults}
	<div class="max-w-2xl mx-auto">
		<h2 class="text-2xl">Results</h2>
		<div class="grid grid-cols-12 gap-2">
			{#if roomState.showResults}
				{#each results as result}
					<div class="col-span-11">
						<Progress value={result.percentage} class="h-2 inline-block" />
					</div>
					<p class="inline-block text-lg font-semibold text-center">{result.number}</p>
				{/each}
			{/if}
		</div>
	</div>
{/if}
