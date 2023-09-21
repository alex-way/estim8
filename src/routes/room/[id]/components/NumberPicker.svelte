<script lang="ts">
	import { enhance } from '$app/forms';
	import type { RoomState } from '../types';
	import { Button } from '$lib/components/ui/button';

	export let roomState: RoomState;
	export let deviceId: string;

	$: numberSelected = roomState.users[deviceId]?.chosenNumber;
</script>

<div class="flex w-full items-center space-x-2 my-4 justify-center">
	{#each roomState.selectableNumbers as number (number)}
		<form
			method="post"
			action="?/submitNumber"
			class="inline-block"
			use:enhance={() => {
				return async ({ update }) => {
					update({ reset: false });
				};
			}}
		>
			<Button
				type="submit"
				name="chosenNumber"
				value={number}
				class="text-2xl p-6"
				disabled={roomState.showResults || numberSelected === number}>{number}</Button
			>
		</form>
	{/each}
</div>
