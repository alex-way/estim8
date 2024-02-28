<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { enhance } from '$app/forms';
	import { deviceId, isRoomAdmin } from '$lib/stores/roomStateStore';

	let { choice } = $props<{ choice: number | '?' }>();
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
					action="?/removeChoice"
					use:enhance={() => {
						return async ({ update }) => {
							update({ reset: false, invalidateAll: false });
						};
					}}
				>
					<input type="hidden" name="choice" value={choice} />
					<button type="submit">Remove choice</button>
				</form>
			</ContextMenu.Item>
		</ContextMenu.Content>
	{/if}
</ContextMenu.Root>
