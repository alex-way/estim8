<script lang="ts">
	import { enhance } from '$app/forms';
	import type { RoomState } from '$lib/types';
	import { Button } from '$lib/components/ui/button';

	export let roomState: RoomState;
	export let deviceId: string;
	export let allowUnknown: boolean;

	$: numberSelected = roomState.users[deviceId]?.choice;

	$: participating = roomState.users[deviceId]?.isParticipant ?? true;

	$: choices = [...(allowUnknown ? ['?' as const] : []), ...roomState.config.selectableNumbers];
</script>

<div class="flex w-full items-center space-x-2 my-4 justify-center">
	{#each choices as choice (choice)}
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
				value={choice}
				class="text-2xl p-6"
				disabled={!participating || roomState.showResults || numberSelected === choice}>{choice}</Button
			>
		</form>
	{/each}
</div>
