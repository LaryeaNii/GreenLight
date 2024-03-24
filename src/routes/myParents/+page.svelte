<script>
    import Navbar from '../navbar/+page.svelte';
	import supabase from '$lib/db.js';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';


   
	const parentData = writable([]);
	async function fetchParentData() {

        const { data: user, error: userError } = await supabase.auth.getUser();

if (userError) {
    showToast = true;
    toastType = 'failure';
    toastMessage = 'Error inserting data. Please refresh and try again.';
    console.error('Error fetching user data:', userError.message);
    return;
}

		let { data, error } = await supabase
  .from('parent')
  .select('*')

    if (error) {
        console.error('Error fetching parent data:', error.message);
        return;
    }

    // Log the fetched data
    console.log('Fetched parent data belonging to this school:', data);

    // Update the parentData store with parent names and their associated students
    parentData.set(data);
}

	onMount(fetchParentData);

</script>

<main>
    <Navbar active = {6}/>
     <div class="parent-container">
        <h1>My Parents</h1>
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