<script>
    
    import Navbar from "../navbar/+page.svelte";

</script>



<main>
	<Navbar active={4} />
	<div>
		<h1>List All My Students</h1>
        <p>Check Permissions</p>
        <p>Dynamic Route to update student profile</p>
        
	</div>
</main>

<style>

	main {
       display: flex;
       gap: 40px;
       font-family: "Poppins";
}
</style>