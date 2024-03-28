<script>
	import { page } from '$app/stores';
	import Navbar from '../../navbar/+page.svelte';
	import supabase from '$lib/db.js';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
    import { goto } from "$app/navigation";

	let studentID;
	const studentData = writable([]);
	const schoolData = writable([]);
	const parentData = writable([]);
	let accumulatedCount = 0;


    function navigatetoparent(id){
		goto(`/addNew/${id}`);	
	}

	studentID = $page.params.studentDetailsID;

	async function fetchStudentData() {
		const { data, error } = await supabase.from('student').select('*').eq('studentkey', studentID);

		if (error) {
			console.error('Error fetching student data:', error.message);
			return;
		}

		console.log('Fetched student data:', data);
		studentData.set(data);
	}

	async function fetchSchoolData() {
		const { data, error } = await supabase.from('schools').select('*');

		if (error) {
			console.error('Error fetching school data:', error.message);
			return;
		}

		console.log('Fetched school data:', data);
		schoolData.set(data);
	}

	async function fetchParentData() {
		const { data, error } = await supabase.from('parent').select('*');

		if (error) {
			console.error('Error fetching parent data:', error.message);
			return;
		}

		console.log('Fetched parent data:', data);
		parentData.set(data);
	}

	onMount(async () => {
		await fetchStudentData();
		await fetchSchoolData();
		await fetchParentData();

		// Calculate accumulated count after all data is fetched
		$studentData.forEach((student) => {
			student.default_count.forEach(({ count }) => {
				accumulatedCount += count;
			});
		});
	});
</script>

<main>
	<Navbar active={4} />

	{#each $studentData as student}
		<div class="large-one">
			<div class="student-and-school">
                <div class="just-student">
                    <h2>{student.studentName}</h2>
                    <p>Student ID: {student.studentkey}</p>
                    {#if $schoolData.find((school) => school.schoolkey === student.studentSchool)}
                        <p>
                            Current School Name:
                            {$schoolData.find((school) => school.schoolkey === student.studentSchool)?.schoolName}
                        </p>
                    {:else}
                        <p>School Name: Not found</p>
                    {/if}
                    <p>Credit Score: {student.credit_score}</p>
                      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                       <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <p class="parent-id" on:click={navigatetoparent(student.parent)}>Parent ID: {student.parent}</p>
                  
                    {#if $parentData.find((parent) => parent.parent_key === student.parent)}
                       
                        <p>
                            Parent Name:
                            {$parentData.find((parent) => parent.parent_key === student.parent)?.parentName}
                        </p>
                    {:else}
                        <p>Parent Name: Not found</p>
                    {/if}
                </div>
				
				<div class="school-details">
					<h4>School Details:</h4>
					{#if $schoolData.find((schoolData) => schoolData.schoolkey === student.studentSchool)}
						<p>
							School ID: {$schoolData.find(
								(schoolData) => schoolData.schoolkey === student.studentSchool
							)?.schoolkey || ''}
						</p>
						<p>
							School Name: {$schoolData.find(
								(schoolData) => schoolData.schoolkey === student.studentSchool
							)?.schoolName || ''}
						</p>
						<p>
							Location: {$schoolData.find(
								(schoolData) => schoolData.schoolkey === student.studentSchool
							)?.location || ''}
						</p>
						<p>
							Website: {$schoolData.find(
								(schoolData) => schoolData.schoolkey === student.studentSchool
							)?.website || ''}
						</p>
						<p>
							Phone: {$schoolData.find(
								(schoolData) => schoolData.schoolkey === student.studentSchool
							)?.phone || ''}
						</p>
						<p>
							Email: {$schoolData.find(
								(schoolData) => schoolData.schoolkey === student.studentSchool
							)?.school_email || ''}
						</p>
					{/if}
				</div>
			</div>
			<div class="schools-attended">
				<h3>All Schools Attended:</h3>
				{#each student.default_count as { school, count }}
					<div class="school-in-list">
						<p>School ID: {school}</p>
						{#if $schoolData.find((schoolData) => schoolData.schoolkey === school)}
							<p>
								School Name:
								{$schoolData.find((schoolData) => schoolData.schoolkey === school)?.schoolName}
							</p>
						{:else}
							<p>School Name: Not found</p>
						{/if}
						<p>Default Count: {count}</p>
					</div>
				{/each}

				<!-- Display accumulated count value -->
				<p>Accumulated Count: {accumulatedCount}</p>
                <br>
        
                <h3>Request Student Transfer</h3>
			</div>
             
		</div>
	{/each}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	main {
		display: flex;
		font-family: 'Roboto', sans-serif;
		gap: 40px;
	}
    .large-one{
        width: 75%;
        display: flex;
        justify-content: space-between;
    }
    .student-and-school{
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        font-size: 20px;
    }
    .schools-attended{
        margin-top: 25px;
        font-size: 20px;
    }
    .school-in-list{
        border: 1px solid #ccc;
        margin-bottom: 13px;
        padding: 10px;
    }
    .parent-id{
        color: rgb(126, 3, 36);
        cursor: pointer;
    }
</style>
