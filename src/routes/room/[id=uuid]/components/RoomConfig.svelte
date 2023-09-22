<script lang="ts">
	import { enhance } from '$app/forms';
	import type { RoomState } from '$lib/roomState';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Context from './Context.svelte';

	export let roomState: RoomState;
	export let deviceId: string;

	$: participating = roomState.users[deviceId]?.isParticipant ?? true;
</script>

<div class="border-white border-opacity-20 border-l-2 h-full p-4">
	<div class="flex gap-2 my-2">
		<form method="post" action="?/inverseParticipation" use:enhance>
			<input type="hidden" name="deviceId" value={deviceId} />
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button type="submit" size="sm" class="inline-block">{participating ? 'Participating' : 'Observing'}</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Changing this option allows you to sit out of the voting and observe the results.</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</form>

		<form method="post" action="?/inverseSnooping" use:enhance>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button type="submit" size="sm" class="inline-block"
						>{roomState.config.allowObserversToSnoop ? 'Disable Snooping' : 'Allow Snooping'}</Button
					>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Snooping allows observers to view results before they've been revealed.</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</form>
	</div>

	<h1 class="text-xl">Participants</h1>

	<div class="grid grid-cols-1 gap-2 my-4">
		{#each Object.entries(roomState.users) as [_, user] (user.deviceId)}
			<Context currentUserDeviceId={deviceId} adminDeviceId={roomState.adminDeviceId || ''} {user}>
				<p>
					<span
						class={`animate-pulse ${
							!user.isParticipant ? 'text-yellow-500' : user.chosenNumber != null ? 'text-emerald-500' : 'text-white'
						}`}>●</span
					>
					{user.name}
					{#if !user.isParticipant}
						<small class="text-xs text-slate-400">(Observing)</small>
					{/if}
					{#if roomState.adminDeviceId === user.deviceId}
						<Badge variant="secondary">Admin</Badge>
					{/if}
				</p>
			</Context>
		{/each}
	</div>
</div>
