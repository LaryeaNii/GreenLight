<script>
	import Navbar from '../navbar/+page.svelte';


</script>

<main>
	<Navbar active={5} />
	<div>
		<h1>Requests</h1>
        <p>Show request for parent edit</p>
     
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
	   font-family: "Poppins";
}
</style>
