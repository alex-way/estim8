<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import { deviceId, presenceInfo, roomState } from '$lib/stores/roomStateStore';
	import { cardBacks } from '$lib/types';
	import type { ActionData, PageData } from '../$types';

	let { data, form, name = $bindable() }: { data: PageData; form: ActionData; name: string | undefined } = $props();

	$roomState = data.roomState;
	$deviceId = data.deviceId;
	$presenceInfo = { [data.deviceId]: [] };

	$inspect($roomState);

	const deviceExistsInRoom = $derived(!!name && $deviceId in $roomState.users && $roomState.users[$deviceId].name);
	const nameExistsInRoom = $derived(deviceExistsInRoom && $roomState.users[$deviceId].name === name);

	const nameAlreadyExists = $derived(
		Object.values($roomState.users).some((user) => user.name === name && $deviceId !== user.deviceId)
	);

	let currentCardBack = $derived($roomState.users[$deviceId]?.config?.cardBack || 'default');
</script>

<div class="grid w-full max-w-sm items-center gap-1.5">
	<div class="flex">
		<Dialog.Root>
			<Dialog.Trigger><Button type="button" size="sm">Edit profile</Button></Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Edit profile</Dialog.Title>
					<Dialog.Description class="grid gap-2 grid-cols-1">
						<form
							method="post"
							action="?/setName"
							class="w-full max-w-sm items-center space-x-2 mx-auto flex gap-2 align-middle"
							use:enhance={() => {
								localStorage.setItem('name', name || '');
								return async ({ update }) => {
									update({ reset: false, invalidateAll: false });
								};
							}}
						>
							<Label for="name">Name</Label>
							<Input type="text" name="name" placeholder="Name" maxlength={32} bind:value={name} />
							<Button type="submit" disabled={nameAlreadyExists} class={`${nameExistsInRoom ? 'hidden' : ''}`}
								>Set</Button
							>
						</form>
						<form
							method="post"
							action="?/setCardBack"
							class="w-full max-w-sm items-center space-x-2 mx-auto flex gap-2 align-middle"
							use:enhance={() => {
								return async ({ update }) => {
									update({ reset: false, invalidateAll: false });
								};
							}}
						>
							<Label for="cardback">Card back</Label>
							<Select.Root name="cardback" selected={{ value: currentCardBack }}>
								<Select.Trigger class="w-[180px]">
									<Select.Value placeholder="Card Back" />
								</Select.Trigger>
								<Select.Content>
									{#each cardBacks as background}
										<Select.Item value={background}
											>{background.charAt(0).toUpperCase() + background.slice(1)}</Select.Item
										>
									{/each}
								</Select.Content>
								<Select.Input name="cardBack" />
							</Select.Root>
							<Button type="submit">Update</Button>
						</form>
					</Dialog.Description>
				</Dialog.Header>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	{#if form?.errors?.name}
		<p class="text-sm text-muted-foreground">{form.errors.name}</p>
	{/if}
</div>
