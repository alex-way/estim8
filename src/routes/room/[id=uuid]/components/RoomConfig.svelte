<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Context from './Context.svelte';
	import { roomState, deviceId, isParticipating, isRoomAdmin } from '$lib/stores/roomStateStore';

	let { allPresentRoomMembers } = roomState;
</script>

<div class="p-4 grid gap-2">
	<div class="flex gap-2">
		<form
			method="post"
			action="?/inverseParticipation"
			use:enhance={() => {
				return async ({ update }) => {
					update({ reset: false, invalidateAll: false });
				};
			}}
		>
			<input type="hidden" name="deviceId" value={$deviceId} />
			<Tooltip.Root openDelay={200}>
				<Tooltip.Trigger asChild let:builder>
					<Button builders={[builder]} type="submit" size="sm" class="inline-block"
						>{$isParticipating ? 'Participating' : 'Observing'}</Button
					>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Changing this option allows you to sit out of the voting and observe the results.</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</form>

		<form
			method="post"
			action="?/inverseSnooping"
			use:enhance={() => {
				return async ({ update }) => {
					update({ reset: false, invalidateAll: false });
				};
			}}
		>
			<Tooltip.Root openDelay={200}>
				<Tooltip.Trigger asChild let:builder>
					<Button builders={[builder]} type="submit" size="sm" class="inline-block" disabled={!$isRoomAdmin}
						>{$roomState.config.allowObserversToSnoop ? 'Disable Snooping' : 'Allow Snooping'}</Button
					>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Snooping allows observers to view results before they've been revealed.</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</form>

		<form
			method="post"
			action="?/inverseAllowUnknown"
			use:enhance={() => {
				return async ({ update }) => {
					update({ reset: false, invalidateAll: false });
				};
			}}
		>
			<Tooltip.Root openDelay={200}>
				<Tooltip.Trigger asChild let:builder>
					<Button builders={[builder]} type="submit" size="sm" class="inline-block" disabled={!$isRoomAdmin}
						>{$roomState.config.allowUnknown ? 'Disallow Unknown' : 'Allow Unknown'}</Button
					>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Snooping allows observers to view results before they've been revealed.</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</form>
	</div>

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
