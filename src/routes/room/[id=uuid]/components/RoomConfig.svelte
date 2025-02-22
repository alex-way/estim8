<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { deviceId, isParticipating, isRoomAdmin, roomState } from '$lib/stores/roomStateStore';
	import { Plus } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import Context from './Context.svelte';

	const { additionalButtons }: { additionalButtons?: Snippet } = $props();

	let { allPresentRoomMembers } = roomState;

	let isAdminOnline = $derived(
		!!$roomState.adminDeviceId && $allPresentRoomMembers.some((user) => user.deviceId === $roomState.adminDeviceId)
	);
</script>

<div class="p-4 grid gap-2">
	<div class="flex gap-2">
		<form
			method="post"
			action="?/setParticipation"
			use:enhance={() => {
				return async ({ update }) => {
					update({ reset: false, invalidateAll: false });
				};
			}}
		>
			<input type="hidden" name="deviceId" value={$deviceId} />
			{#if !$isParticipating}
				<input type="hidden" name="participating" value={1} />
			{/if}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button type="submit" size="sm" class="inline-block"
							>{$isParticipating ? 'Participating' : 'Observing'}</Button
						>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Changing this option allows you to sit out of the voting and observe the results.</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</form>

		<form
			method="post"
			action="?/setAllowSnooping"
			use:enhance={() => {
				return async ({ update }) => {
					update({ reset: false, invalidateAll: false });
				};
			}}
		>
			{#if !$roomState.config.allowObserversToSnoop}
				<input type="hidden" name="allowSnooping" value={1} />
			{/if}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button type="submit" size="sm" class="inline-block" disabled={!$isRoomAdmin}
							>{$roomState.config.allowObserversToSnoop ? 'Disable Snooping' : 'Allow Snooping'}</Button
						>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Snooping allows observers to view results before they've been revealed.</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</form>

		<form
			method="post"
			action="?/setAllowUnknown"
			use:enhance={() => {
				return async ({ update }) => {
					update({ reset: false, invalidateAll: false });
				};
			}}
		>
			{#if !$roomState.config.allowUnknown}
				<input type="hidden" name="allowUnknown" value={1} />
			{/if}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button type="submit" size="sm" class="inline-block" disabled={!$isRoomAdmin}
							>{$roomState.config.allowUnknown ? 'Disallow Unknown' : 'Allow Unknown'}</Button
						>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Snooping allows observers to view results before they've been revealed.</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</form>
		{@render additionalButtons?.()}
	</div>

	{#if $isRoomAdmin}
		<form action="?/addChoice" method="post" use:enhance>
			<Label for="choice">Add a choice</Label>
			<div class="flex w-1/2">
				<Input
					type="number"
					name="choice"
					class="text-center text-xl bg-slate-700 rounded-r-none w-12"
					min={0}
					max={999}
					autofocus
					required
				/>
				<Button type="submit" class="rounded-l-none p-1 w-12"><Plus size={16} /></Button>
			</div>
		</form>
	{/if}

	{#if !isAdminOnline}
		<form action="?/claimAdmin" method="post" use:enhance>
			<Label for="choice">Claim Admin</Label>
			<Button type="submit" size="sm" class="inline-block">Claim Admin</Button>
		</form>
	{/if}

	<div>
		<h1 class="text-xl">Participants</h1>

		<div class="grid grid-cols-1 gap-2 my-4">
			{#each Object.entries($allPresentRoomMembers) as [_, user] (user.deviceId)}
				<Context {user}>
					<p>
						<span
							class={`animate-pulse ${
								!user.isParticipant ? 'text-yellow-500' : user.choice != null ? 'text-emerald-500' : 'text-white'
							}`}>●</span
						>
						{user.name}
						{#if !user.isParticipant}
							<small class="text-xs text-slate-400">(Observing)</small>
						{/if}
						{#if $roomState.adminDeviceId === user.deviceId}
							<Badge variant="secondary">Admin</Badge>
						{/if}
					</p>
				</Context>
			{/each}
		</div>
	</div>
</div>
