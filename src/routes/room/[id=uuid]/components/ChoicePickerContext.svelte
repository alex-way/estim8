<script lang="ts">
import { enhance } from "$app/forms";
import * as ContextMenu from "$lib/components/ui/context-menu";
import { isRoomAdmin } from "$lib/stores/roomStateStore";

const { choice }: { choice: number | "?" } = $props();
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
