<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { enhance } from '$app/forms';

	export let deviceId: string;
	export let userDeviceId: string;
	export let adminDeviceId: string;
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger class="cursor-pointer">
		<slot />
	</ContextMenu.Trigger>
	{#if adminDeviceId === deviceId}
		<ContextMenu.Content>
			<ContextMenu.Item>
				<form method="post" action="?/inverseParticipation" use:enhance>
					<input type="hidden" name="deviceId" value={deviceId} />
					<button type="submit">Make observer</button>
				</form>
			</ContextMenu.Item>
			<ContextMenu.Item>
				<form method="post" action="?/setAdmin" use:enhance>
					<input type="hidden" name="deviceId" value={deviceId} />
					<button type="submit">Make room admin</button>
				</form>
			</ContextMenu.Item>
			{#if userDeviceId !== deviceId}
				<ContextMenu.Item>
					<form method="post" action="?/removeUserFromRoom" use:enhance>
						<input type="hidden" name="deviceId" value={deviceId} />
						<button type="submit">Remove from room</button>
					</form>
				</ContextMenu.Item>
			{/if}
		</ContextMenu.Content>
	{/if}
</ContextMenu.Root>
