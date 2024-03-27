<script>
	import Navbar from '../navbar/+page.svelte';


</script>

<main>
	<Navbar active={3} />
	<div>
		<h1>Profile Page</h1>
        <p>Update School Name</p>
        <p>Update Email</p>
        <p>Update Password</p>
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
	   font-family: "Roboto";
}
</style>
