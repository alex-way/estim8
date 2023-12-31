<script lang="ts">
	import type { Choice } from '$lib/types';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import Context from './Context.svelte';
	import Card from '$lib/components/Card.svelte';
	import { roomState } from '$lib/stores/roomStateStore';
	import { fade } from 'svelte/transition';

	export let deviceId: string;
	export let presenceInfo: Record<string, any>;

	$: participants = Object.values($roomState.users)
		.filter((user) => user.isParticipant)
		.filter((user) => user.deviceId in (presenceInfo || {}));

	$: countOfParticipantsVoted = participants.filter((user) => user.choice !== null).length;

	$: isObserving = $roomState.users[deviceId].isParticipant === false;

	type Result = {
		choice: Choice;
		count: number;
		percentage: number;
	};

	let results: Result[];
	$: results = Object.values($roomState.users).reduce<Result[]>((acc, user) => {
		if (user.choice === null) {
			return acc;
		}

		const existingResult = acc.find((result) => result.choice === user.choice);

		if (existingResult) {
			existingResult.count++;
		} else {
			acc.push({
				choice: user.choice,
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
		<Context currentUserDeviceId={deviceId} adminDeviceId={$roomState.adminDeviceId || ''} {user}>
			<Card
				title={user.name}
				pending={user.choice === null}
				reveal={$roomState.showResults ||
					($roomState.config.allowObserversToSnoop && isObserving && user.choice !== null)}
				revealText={user.choice || ''}
			/>
		</Context>
	{/each}
</div>

{#if $roomState.showResults}
	<div class="max-w-2xl mx-auto">
		<h2 class="text-2xl">Results</h2>
		<div class="grid grid-cols-12 gap-2">
			{#if $roomState.showResults}
				{#each results as result}
					<div transition:fade class="col-span-10">
						<Progress value={result.percentage} class="h-2 inline-block" />
					</div>
					<div class="col-span-2">
						<p class="text-lg font-semibold text-center">
							{result.choice} <small class="text-xs">({result.count} vote{result.count > 1 ? 's' : ''})</small>
						</p>
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}
