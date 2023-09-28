<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { enhance } from '$app/forms';
	import type { RoomUser } from '$lib/types';

	export let currentUserDeviceId: string;
	export let adminDeviceId: string;
	export let user: RoomUser;

	$: currentUserIsAdmin = adminDeviceId === currentUserDeviceId;
	$: isSelf = user.deviceId === currentUserDeviceId;
	$: isAlreadyAdmin = adminDeviceId === user.deviceId;
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger class="cursor-pointer">
		<slot />
	</ContextMenu.Trigger>
	{#if currentUserIsAdmin}
		<ContextMenu.Content>
			<ContextMenu.Item>
				<form method="post" action="?/inverseParticipation" use:enhance>
					<input type="hidden" name="deviceId" value={user.deviceId} />
					<button type="submit">Make {user.isParticipant ? 'observer' : 'participant'}</button>
				</form>
			</ContextMenu.Item>
			{#if !isAlreadyAdmin}
				<ContextMenu.Item>
					<form method="post" action="?/setAdmin" use:enhance>
						<input type="hidden" name="deviceId" value={user.deviceId} />
						<button type="submit">Make room admin</button>
					</form>
				</ContextMenu.Item>
			{/if}
			{#if !isSelf}
				<ContextMenu.Item>
					<form method="post" action="?/removeUserFromRoom" use:enhance>
						<input type="hidden" name="deviceId" value={user.deviceId} />
						<button type="submit">Remove from room</button>
					</form>
				</ContextMenu.Item>
			{/if}
		</ContextMenu.Content>
	{/if}
</ContextMenu.Root>
