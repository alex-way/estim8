<script>
	import { Toaster } from '$lib/components/ui/sonner';
	import '../app.css';
</script>

<div class="min-h-screen bg-background" id="page">
	<nav class="w-full border-b-2 border-white border-opacity-20 p-2 text-2xl px-40"><a href="/">Estimate</a></nav>
	<slot />
</div>
<Toaster />
