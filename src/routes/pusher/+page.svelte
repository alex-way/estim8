<script lang="ts">
	import Pusher, { type Channel } from 'pusher-js';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let channel: Channel | undefined;

	onMount(() => {
		var pusher = new Pusher('e0993a6d545a01e45d09', {
			cluster: 'eu'
		});

		var channel = pusher.subscribe('my-channel');
		channel.bind('my-event', function (data: any) {
			alert(JSON.stringify(data));
		});
	});
</script>

<h1>Pusher</h1>

<button on:click={() => channel && channel.trigger('client-test', { message: 'hello world' })}
	>Disconnect</button
>
