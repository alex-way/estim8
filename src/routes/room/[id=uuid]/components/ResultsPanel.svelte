<script lang="ts">
	import type { RoomState } from '$lib/roomState';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import Context from './Context.svelte';
	import Card from '$lib/components/Card.svelte';

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
			<Card
				title={user.name}
				pending={user.chosenNumber === null}
				reveal={roomState.showResults ||
					(roomState.config.allowObserversToSnoop && isObserving && user.chosenNumber !== null)}
				revealText={user.chosenNumber?.toString() || ''}
			/>
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
