<script>
	import '../app.css';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	injectSpeedInsights();
</script>

<div class="min-h-screen bg-background" id="page">
	<nav class="w-full border-b-2 border-white border-opacity-20 p-2 text-2xl px-40"><a href="/">Estim8</a></nav>
	<slot />
</div>
