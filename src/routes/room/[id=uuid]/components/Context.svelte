<script lang="ts">
	import { enhance } from '$app/forms';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { deviceId, isRoomAdmin, roomState } from '$lib/stores/roomStateStore';
	import type { RoomUser } from '$lib/types';

	const { user }: { user: RoomUser } = $props();

	const adminDeviceId = $derived($roomState.adminDeviceId || '');
	const isSelf = $derived(user.deviceId === $deviceId);
	const isAlreadyAdmin = $derived(adminDeviceId === user.deviceId);
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger class="cursor-pointer">
		<slot />
	</ContextMenu.Trigger>
	{#if $isRoomAdmin}
		<ContextMenu.Content>
			<ContextMenu.Item>
				<form
					method="post"
					action="?/setParticipation"
					use:enhance={() => {
						return async ({ update }) => {
							update({ reset: false, invalidateAll: false });
						};
					}}
				>
					{#if !user.isParticipant}
						<input type="hidden" name="participating" value={1} />
					{/if}
					<input type="hidden" name="deviceId" value={user.deviceId} />
					<button type="submit">Make {user.isParticipant ? 'observer' : 'participant'}</button>
				</form>
			</ContextMenu.Item>
			{#if !isAlreadyAdmin}
				<ContextMenu.Item>
					<form
						method="post"
						action="?/setAdmin"
						use:enhance={() => {
							return async ({ update }) => {
								update({ reset: false, invalidateAll: false });
							};
						}}
					>
						<input type="hidden" name="deviceId" value={user.deviceId} />
						<button type="submit">Make room admin</button>
					</form>
				</ContextMenu.Item>
			{/if}
			{#if !isSelf}
				<ContextMenu.Item>
					<form
						method="post"
						action="?/removeUserFromRoom"
						use:enhance={() => {
							return async ({ update }) => {
								update({ reset: false, invalidateAll: false });
							};
						}}
					>
						<input type="hidden" name="deviceId" value={user.deviceId} />
						<button type="submit">Remove from room</button>
					</form>
				</ContextMenu.Item>
			{/if}
		</ContextMenu.Content>
	{/if}
</ContextMenu.Root>
