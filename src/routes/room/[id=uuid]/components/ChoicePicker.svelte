<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { deviceId, isParticipating, roomState } from '$lib/stores/roomStateStore';
	import { toast } from 'svelte-sonner';
	import ChoicePickerContext from './ChoicePickerContext.svelte';

	let selectedNumber = $derived($roomState.users[$deviceId]?.choice);

	let { selectableChoices } = roomState;
</script>

<div class="flex w-full items-center my-4 justify-center flex-wrap gap-2">
	{#each $selectableChoices as choice (choice)}
		<ChoicePickerContext {choice}>
			<form
				method="post"
				action="?/submitNumber"
				use:enhance={() => {
					const oldChoice = $roomState.users[$deviceId].choice;
					$roomState.users[$deviceId].choice = choice;
					return async ({ update, result }) => {
						update({ reset: false, invalidateAll: false });
						if (result.type === 'error' || result.type === 'failure') {
							toast.error('Something went wrong. Please try again later.');
							$roomState.users[$deviceId].choice = oldChoice;
						}
					};
				}}
			>
				<Button
					type="submit"
					name="chosenNumber"
					value={choice}
					class="text-2xl p-6"
					disabled={!$isParticipating || $roomState.showResults || selectedNumber === choice}>{choice}</Button
				>
			</form>
		</ChoicePickerContext>
	{/each}
</div>
