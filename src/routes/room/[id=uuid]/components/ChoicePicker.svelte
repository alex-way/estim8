<script lang="ts">
import { enhance } from "$app/forms";
import { Button } from "$lib/components/ui/button";
import { roomState, deviceId, isParticipating } from "$lib/stores/roomStateStore";
import ChoicePickerContext from "./ChoicePickerContext.svelte";

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
					$roomState.users[$deviceId].choice = choice;
					return async ({ update }) => {
						update({ reset: false, invalidateAll: false });
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
