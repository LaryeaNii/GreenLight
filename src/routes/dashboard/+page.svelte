<script>
	import Navbar from '../navbar/+page.svelte';

  

   

</script>

<main>
	<Navbar active={1} />
	<div>
		<h1>Display Student Cards</h1>
		<p>Make Cards dynamic routes</p>
		<p>Make cards shiny</p>
	</div>
</main>

<style>
	:global(body) {
    margin: 0;
    padding: 0;
  }
	main {
		display: flex;
		gap: 40px;
		font-family: 'Poppins';
	}
</style>
