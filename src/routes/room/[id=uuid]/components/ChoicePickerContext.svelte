<script lang="ts">
	import { enhance } from '$app/forms';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { isRoomAdmin } from '$lib/stores/roomStateStore';
	import type { Snippet } from 'svelte';

	const { choice, children }: { choice: number | '?'; children: Snippet } = $props();
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger class="cursor-pointer">
		{@render children()}
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
