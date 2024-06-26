<script lang="ts">
	import Button from '$/lib/components/ui/button/button.svelte';
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_PUSHER_APP_KEY } from '$env/static/public';
	import { SIMPLE_FIB_SEQ, getChannelName } from '$lib/constants';
	import Pusher, { type PresenceChannel } from 'pusher-js';
	import { onMount } from 'svelte';

	let loading = $state(false);

	let presenceChannel: PresenceChannel | undefined;

	const channelName = getChannelName($page.params.id);

	onMount(() => {
		const pusher = new Pusher(PUBLIC_PUSHER_APP_KEY, {
			cluster: 'eu',
			userAuthentication: {
				endpoint: '/pusher/user-auth',
				transport: 'ajax'
			},
			channelAuthorization: {
				endpoint: '/pusher/channel-auth',
				transport: 'ajax'
			}
		});

		presenceChannel = pusher.subscribe(channelName) as PresenceChannel;

		presenceChannel.bind('room:reload', async () => {
			pusher.unsubscribe(channelName);
			pusher.disconnect();
			await goto(`/room/${$page.params.id}`, { replaceState: true, invalidateAll: true });
		});

		return () => {
			pusher.unsubscribe(channelName);
			pusher.disconnect();
		};
	});
</script>

<div class="h-full text-white flex flex-col justify-center items-center py-40">
	<h1 class="text-4xl md:text-6xl font-bold mb-4">{$page.status}</h1>
	<h2 class="text-2xl md:text-4xl font-semibold mb-6">
		{$page.status == 404 && "Oops! The room you're looking for doesn't exist."}
	</h2>
	{#if $page.status == 404}
		<p class="text-lg mb-6 text-center md:w-1/2">This room doesn't exist.</p>
		<form
			action="/room/new?/createRoom"
			method="post"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					update({ reset: false, invalidateAll: false });
				};
			}}
		>
			{#each SIMPLE_FIB_SEQ as choice}
				<input type="hidden" name="choices" value={choice} />
			{/each}
			<input type="hidden" name="roomId" value={$page.params.id} />
			<Button type="submit" size="lg" class="w-full my-4" disabled={loading}
				>{loading ? 'Loading...' : 'Quick create room'}</Button
			>
		</form>
	{/if}
	<div class="flex flex-col md:flex-row gap-4">
		<a
			href="/"
			class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 h-10 px-4 py-2 bg-white text-black"
		>
			Go Home
		</a>
	</div>
</div>
