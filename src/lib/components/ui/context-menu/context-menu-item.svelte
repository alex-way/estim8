<script lang="ts">
	import { cn } from '$lib/utils';
	import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';

	type $$Props = ContextMenuPrimitive.ItemProps & {
		inset?: boolean;
	};
	type $$Events = ContextMenuPrimitive.ItemEvents;

	let className: $$Props['class'] = undefined;
	export let inset: $$Props['inset'] = undefined;
	export { className as class };
</script>

<ContextMenuPrimitive.Item
	class={cn(
		'relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 cursor-pointer',
		inset && 'pl-8',
		className
	)}
	{...$$restProps}
	on:click
	on:keydown
	on:focusin
	on:focusout
	on:pointerdown
	on:pointerleave
	on:pointermove
>
	<slot />
</ContextMenuPrimitive.Item>
