<script>
	import { page } from '$app/stores';
	import Navbar from '../../navbar/+page.svelte';
	import supabase from '$lib/db.js';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { goto } from '$app/navigation';
	import loader from '$lib/dots.gif';

	let studentID;
	const studentData = writable([]);
	const schoolData = writable([]);
	const parentData = writable([]);
	let accumulatedCount = 0;
	let isTheOwner = false;
	let dataLoaded = false;
	let isTheOwnerVisible;

	async function sendRequest() {
		console.log('My School ID', studentData.studentSchool);
		if ($studentData.length === 0) {
			console.error('Student data not found.');
			return;
		}

		const student = $studentData[0];

		const { data: userResult, error: userError } = await supabase.auth.getUser();
		const { user } = userResult;

		// Prepare the request object
		const request = {
			requester: user.id,
			receiver: student.studentSchool,
			time: new Date(),
			student_id: studentID,
			student_name: student.studentName
		};

		// Fetch the current requesters array from the database
		const { data: theSchoolData, error: fetchError } = await supabase
			.from('schools')
			.select('student_transfer_request')
			.eq('schoolkey', student.studentSchool)
			.single();

		if (fetchError) {
			console.error('Error fetching current requesters:', fetchError.message);
			return;
		}

		const currentRequesters = theSchoolData ? theSchoolData.student_transfer_request || [] : [];

		// Find the school record
		const { data: schoolRecord, error: schoolError } = await supabase
			.from('schools')
			.select('*')
			.eq('schoolkey', student.studentSchool)
			.single();

		if (schoolError) {
			console.error('Error fetching school record:', schoolError.message);
			return;
		}

		if (!schoolRecord) {
			console.error(`School with ID ${studentData.studentSchool} not found.`);
			return;
		}

		// Update the parent database with the appended requesters array
		const { error } = await supabase
			.from('schools')
			.update({ student_transfer_request: [...currentRequesters, request] }) // Append the new request to the current requesters array
			.eq('schoolkey', student.studentSchool);

		if (error) {
			console.error('Error sending request:', error.message);
		} else {
			console.log('Request sent successfully.');
			// Handle success
			goto('/transfers');
		}
	}

	function navigatetoparent(id) {
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

		const { data: userResult, error: userError } = await supabase.auth.getUser();
		const { user } = userResult;

		// Check if the user is the owner of the student's school after studentData is populated
		if ($studentData.length > 0 && $studentData[0].studentSchool === user.id) {
			console.log('I am the principal of this student');
			isTheOwner = true;
		} else {
			console.log('I am not the principal of this student');
			isTheOwner = false;
		}
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

		dataLoaded = true;

		// Get the user object
		
	});
	$: isTheOwnerVisible = isTheOwner;


</script>

<main>
	<Navbar active={4} />
	{#if !dataLoaded}
	<div class="loading">
		<img src={loader} alt="loading"></div>
	{:else}
		{#each $studentData as student}
			<div class="large-one">
				<div class="student-and-school">
					<div class="just-student">
						<h2>{student.studentName}</h2>
						<p>Student ID: {student.studentkey}</p>
						{#if $schoolData.find((school) => school.schoolkey === student.studentSchool)}
							<p>
								Current School:
								{$schoolData.find((school) => school.schoolkey === student.studentSchool)
									?.schoolName}
							</p>
						{:else}
							<p>School Name: Not found</p>
						{/if}
						<p>Credit Score: {student.credit_score}</p>
						<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<p class="parent-id" on:click={navigatetoparent(student.parent)}>
							Parent ID: {student.parent}
						</p>

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
					<div class="request-scroll">
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
					</div>
					

					<!-- Display accumulated count value -->
					<p>Accumulated Count: {accumulatedCount}</p>
					<br />
                    {#if !isTheOwnerVisible}
					<button class="request-transfer" on:click={sendRequest}>Request Student Transfer</button>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
</main>

<style>
		.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 30px;
  height: 100vh;
  width: 80%; /* Set height to full viewport height */
}

.loading img {
  max-width: 100%; 
  max-height: 100%; 
  object-fit: contain; /* Maintain aspect ratio */
}
	:global(body) {
		margin: 0;
		padding: 0;
	}
	.request-transfer{
		border: 1px solid black;
		background-color: transparent;
		font-size: 22px;
		padding: 20px;
		cursor: pointer;
	}
	.request-transfer:hover{
		background-color: black;
		color: white;
	}
	.request-scroll{
		height: 400px;
		max-height: 400px;
		overflow-y: scroll;
	}

	main {
		display: flex;
		font-family: 'Roboto', sans-serif;
		gap: 40px;
	}
	.large-one {
		width: 75%;
		display: flex;
		justify-content: space-between;
	}
	.student-and-school {
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		font-size: 20px;
	}
	.schools-attended {
		margin-top: 25px;
		font-size: 20px;
	}
	.school-in-list {
		border: 1px solid #ccc;
		margin-bottom: 13px;
		padding: 10px;
	}
	.parent-id {
		color: rgb(126, 3, 36);
		cursor: pointer;
	}
	.request-scroll::-webkit-scrollbar {
    width: 6px; /* Width of the scrollbar */
    height: 6px; /* Height of the scrollbar (if vertical) */
}

/* Thin scrollbar thumb */
.request-scroll::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.5); /* Color of the scrollbar thumb */
    border-radius: 3px; /* Rounded corners */
}

/* Hover effect for scrollbar thumb */
.request-scroll::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.7);
	width: 16px; /* Color of the scrollbar thumb on hover */
}

@media only screen and (max-width: 768px) {
	.large-one {
		width: 90%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		margin-left: 14px;
		margin-bottom: 100px;
	}
	
}

</style>
