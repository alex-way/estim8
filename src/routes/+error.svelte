<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="h-full text-white flex flex-col justify-center items-center py-40">
	<h1 class="text-4xl md:text-6xl font-bold mb-4">{$page.status}</h1>
	<h2 class="text-2xl md:text-4xl font-semibold mb-6">
		{$page.status == 404 && "Oops! The page you're looking for doesn't exist."}
	</h2>
	{#if $page.status == 404}
		<p class="text-lg mb-6 text-center md:w-1/2">
			You might have followed a bad link or entered a URL that doesn't exist on our site. Don't worry though, we'll help
			get you back on track.
		</p>
	{/if}
	<div class="flex flex-col md:flex-row gap-4">
		<button
			class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 h-10 px-4 py-2 bg-white text-black"
		>
			<a href="/">Go Home</a>
		</button>
	</div>
</div>
