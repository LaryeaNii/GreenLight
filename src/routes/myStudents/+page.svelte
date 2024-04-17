<script>
	import Navbar from '../navbar/+page.svelte';
	import supabase from '$lib/db.js';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
    import { goto } from "$app/navigation";
    import edit from '$lib/edit-svgrepo-com.svg';
	import delvalue from '$lib/delete-svgrepo-com.svg';
    import loader from '$lib/dots.gif';


	let editMode = {}; 

	function navigatetostudent(id){
		goto(`/studentDetails/${id}`);	
	}


	let isMounted = false;
	let minScore = 1.8655971604986834;
	let maxScore = 199.44409851489465;
	let maxVal = 850;
	let minVal = 300;
	const schoolData = writable([]);
	let pendingCountsStudents = writable([]);
	let Myuser = writable([]);

	let showToast = false;
	let toastType = ''; // 'success' or 'failure'
	let toastMessage = '';
	let isviewPast =false; 
	let viewButtonText ='View Past Students With Due Counts';
	let theTitletext ='My Students'
	
	function viewPast() {
		isviewPast = !isviewPast;
        viewButtonText = isviewPast ? 'View Current Students' : 'View Past Students With Due Counts';
	    theTitletext = isviewPast ? 'Past Students' : 'My Students'
	}



 

	async function fetchStudents() {
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (!user) {
			console.error('User is not logged in');
			goto('/');
			return;
		}

		try {
			// Fetch all students
			const { data: allStudents, error } = await supabase.from('student').select('*');

			if (error) {
				throw new Error('Error fetching student data: ' + error.message);
			}

			// Filter students with at least one default count associated with current user's school
			const filteredStudents = allStudents.filter((student) => {
				return student.default_count.some((count) => count.school === user.id);
			});

			// Filter students with pending counts
			const studentsWithPendingCounts = filteredStudents.filter((student) => {
				return student.default_count.some((count) => count.count > 0);
			});

			// Filter students not belonging to current user's school anymore
			const pendingCountsFromOtherSchools = studentsWithPendingCounts.filter((student) => {
				return student.studentSchool !== user.id;
			});

			// Update store with students having pending counts from other schools
			pendingCountsStudents.set(pendingCountsFromOtherSchools);
		} catch (error) {
			console.error(error.message);
		}
		Myuser.set(user);
		isMounted = true;
	}

	onMount(fetchStudents);

	async function fetchParentData() {
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (!user) {
			console.error('User is not logged in');
			goto('/');
			return;
		}

		let { data, error } = await supabase
			.from('schools')
			.select(
				`
                    schoolkey, 
                    schoolName,
                    student (
                        studentName, studentkey, credit_score, default_count, individualScore
                    )
                `
			)
			.eq('schoolkey', user.id);

		if (error) {
			console.error('Error fetching school data:', error.message);
			return;
		}

		// Log the fetched data
		console.log('Fetched school data with associated students:', data);

		// Update the parentData store with parent names and their associated students
		schoolData.set(data);
	}

	onMount(fetchParentData);

	async function saveChanges(student) {
		try {
			await supabase
				.from('student')
				.update({
					credit_score: student.credit_score,
					default_count: student.default_count,
					studentName: student.studentName,
				})
				.eq('studentkey', student.studentkey);

			console.log('Changes saved successfully.');
			showToast = true;
			toastType = 'success';
			toastMessage = 'Changes saved successfully.';
			setTimeout(() => {
				showToast = false; // Hide toast after a certain time
			}, 3000);
			fetchStudents(); // Call fetchStudents only after changes are successfully saved
		} catch (error) {
			console.error('Error saving changes:', error.message);
			showToast = true;
			toastType = 'failure';
			toastMessage = 'Error saving changes. Please try again!';
			setTimeout(() => {
				showToast = false; // Hide toast after a certain time
			}, 3000);
		}
	}

	let theCount;

	function increaseCount(student, schoolId) {
		const index = student.default_count.findIndex((count) => count.school === schoolId);
		console.log('what is my school id: ' + schoolId);
		if (index !== -1) {
			theCount = student.default_count[index].count++ + 1;
			console.log('The count: ' + theCount);
			// Recalculate credit score after increasing count
			updateCreditScore(student, schoolId);
			// Update the schoolData store to reflect the changes
			schoolData.update((data) => [...data]);
		}
	}
	function decreaseCount(student, schoolId) {
		const index = student.default_count.findIndex((count) => count.school === schoolId);
		if (index !== -1) {
			theCount = student.default_count[index].count-- - 1; // Decrement count
			console.log('The count: ' + theCount);
			// Ensure count doesn't go below zero

			// Recalculate credit score and update store

			schoolData.update((data) => [...data]);

			updateCreditScore(student, schoolId);
		}
	}
	function pastDecreaseCount(student, schoolId) {
		const index = student.default_count.findIndex((count) => count.school === schoolId);
		if (index !== -1) {
			theCount = student.default_count[index].count-- - 1; // Decrement count
			console.log('The count: ' + theCount);
			// Ensure count doesn't go below zero

			// Recalculate credit score and update store

			pendingCountsStudents.update((data) => [...data]);
                  
			updateCreditScore(student, schoolId);
			saveChanges(student);
		}
	}
	

	let newIndividualScore;
	function updateCreditScore(student, schoolId) {
		const individualScore = student.individualScore;
		let oldData = 0;

		// Filter out counts that do not belong to the schoolID and sum the counts
		student.default_count.forEach((count) => {
			if (count.school !== schoolId) {
				oldData += count.count;
				console.log('Count.school: ' + count.school, 'count.schoolID: ' + schoolId);
				console.log('Count value for school with ID ' + count.school + ': ' + count.count);
			}
		});

		console.log('Total of other counts: ' + oldData);
		console.log('The count as at now: ' + theCount);

		let combinedCount = theCount + oldData;
		console.log('Combined count: ' + combinedCount);

		// Define payment categories and their corresponding factor weights
		const paymentCategory = [
			{ factor: 0, factorWeight: 1 },
			{ factor: 1, factorWeight: 0.7 },
			{ factor: 2, factorWeight: 0.4 },
			{ factor: 3, factorWeight: 0.1 }
		];

		// Find the factor weight based on the default count
		let defaultCountFactorWeight;
		if (combinedCount >= paymentCategory.length) {
			defaultCountFactorWeight = paymentCategory[paymentCategory.length - 1].factorWeight;
		} else {
			defaultCountFactorWeight = paymentCategory[combinedCount].factorWeight;
		}

		// Calculate new individual score based on default count
		newIndividualScore = individualScore * defaultCountFactorWeight;
		console.log(
			'Total count weight: ' + defaultCountFactorWeight,
			'Individual score: ' + individualScore,
			'New individual score: ' + newIndividualScore
		);

		// Update the student's credit score
		let newCreditScore = Math.round(
			((newIndividualScore - minScore) / (maxScore - minScore)) * (maxVal - minVal) + minVal
		);
		console.log('The new credit score: ' + newCreditScore);
		student.credit_score = newCreditScore;
	}

	async function deleteStudent(studentkey) {
  try {
    const { error } = await supabase.from('student').delete().eq('studentkey', studentkey);

    if (error) {
      throw new Error(`Error deleting student: ${error.message}`);
    }

    console.log(`Student with ID ${studentkey} deleted successfully`);

    // Update the schoolData store
    schoolData.update((data) => {
      return data.map((school) => {
        const updatedStudents = school.student.filter((student) => student.studentkey !== studentkey);
        return {
          ...school,
          student: updatedStudents,
        };
      });
    });

    // Update the pendingCountsStudents store
    pendingCountsStudents.update((data) => {
      return data.filter((student) => student.studentkey !== studentkey);
    });

    fetchStudents(); // Re-fetch the student data after successful deletion
  } catch (error) {
    console.error(error.message);
    showToast = true;
    toastType = 'failure';
    toastMessage = 'Error deleting student. Please try again!';
    setTimeout(() => {
      showToast = false;
    }, 3000);
  }
}
</script>

<main>
	<Navbar active={4} />
	<div class="big-container">
	{#if !isMounted}
	<div class="loading">
		<img src={loader} alt="loading"></div>
	{:else}
	<div class="everything">
		<h1>{theTitletext}</h1>
		<button on:click={viewPast}>{viewButtonText}</button>
		{#if !isviewPast}	
		<div class="the-children">
			
			{#each $schoolData.reverse() as school}
				<div>
					<ul>
						{#each school.student as student}
						<li>
							<div class="one-student">
							  {#if editMode[student.studentkey]}
							  <input
								type="text"
								bind:value={student.studentName}
								on:blur={() => (editMode[student.studentkey] = false)}
							  />
							  {:else}
							  <p class="student-name-size">
								{student.studentName}
								<button
								  class="edit-button"
								  on:click={() => (editMode[student.studentkey] = true)}
								>
								  <img src={edit} alt="edit" />
								</button>
							  {/if}
							  <p>Credit Score: {student.credit_score}</p>
							  <ul>
								{#each student.default_count as count}
								{#if count.school === school.schoolkey}
								<div class="due-feature">
								  <li>
									Past Due: {count.count}
									<button on:click={() => increaseCount(student, school.schoolkey)}>
									  +
									</button>
									<button on:click={() => decreaseCount(student, school.schoolkey)}  disabled={count.count === 0}>
									  -
									</button>
								  </li>
								  <button class="save" on:click={() => saveChanges(student)}>
									Save Changes
								  </button>
								  <button
									class="expanding"
									on:click={() => navigatetostudent(student.studentkey)}
								  >
									Expand
								  </button>
								  <button
									class="delete-button"
									on:click={() => deleteStudent(student.studentkey)}
								  >
									<img src={delvalue} alt="delete">
								  </button>
								</div>
								{/if}
								{/each}
							  </ul>
							</div>
						  </li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
		{:else}
		<div class="past-students">
			<div>
				
				{#if $pendingCountsStudents.length === 0}
					<h2>No past students yet.</h2>
				{:else}
				<div class="holding-all-students">
					{#each $pendingCountsStudents as student}
					<div class="past-student-container">
						<p>{student.studentName} (Student ID: {student.studentkey})</p>
						<ul>
							{#each student.default_count as count}
								{#if count.school === $Myuser.id}
									<li class="past-past-button">
										Past Due: {count.count}
										<button on:click={() => pastDecreaseCount(student, count.school)}>Decrease</button>
									</li>
								{/if}
							{/each}
						</ul>
					</div>
				{/each}
				
				</div>
					
				{/if}
			</div>
		</div>
		{/if}
		
	</div>
	{/if}
	
	
	{#if showToast}
		<div class="toast {toastType}">
			<p>{toastMessage}</p>
		</div>
	{/if}
</div>
</main>

<style>
.student-name-size{
	font-size: 13px;
}
	

		.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin-left: 30px;
  width: 90%; /* Set height to full viewport height */
}

.loading img {
  max-width: 100%; 
  max-height: 100%; 
  object-fit: contain; /* Maintain aspect ratio */
}
	:global(body) {
		margin: 0;
		padding: 0;
		overflow-y: hidden;
		font-family: 'Roboto';
	}
	.delete-button{
		position: absolute;
		bottom: 0;
		top: 129px;
		left: 180px;
		border: none;
	}
	.delete-button:hover{
		background-color: transparent;
	}
    .big-container{
      margin-right: 10px;
	  width: 85%;
	}
	.expanding{
		position: absolute;
		top: 129px;
		left: 7px;
		border: none;
		text-decoration: underline;
		color: rgb(0, 0, 0);	
	}

	.expanding:hover{
		color: ghostwhite;
	}
	

    .one-student{
		background-color: rgba(255, 215, 215, 0.256);
		padding: 10px;
		padding-bottom: 30px;
		padding-left: 20px;
		margin: 9px;
		width: 220px;
		border: 1px solid black;
	}

	.toast {
		position: fixed;
		top: 20px;
		left: 50%;
		transform: translateX(-50%); /* Center horizontally */
		padding: 10px 20px;
		border-radius: 8px;
		color: #fff;
		z-index: 999;
		opacity: 0; /* Initially hidden */
		transition: opacity 0.5s ease-in-out; /* Transition for opacity */
	}

	.toast.success {
		background-color: green;
		opacity: 1;
	}

	.toast.failure {
		background-color: red;
		opacity: 1;
		color: white;
	}
	.everything {
		display: flex;
		flex-direction: column;
		
		width: 100%
	}
	.past-students{
		margin-top: 20px;
		margin-left: 40px;
	}
	.past-student-container{
		border: 1px solid black;
		margin: 10px;
		padding: 10px;
		width: fit-content;
		height: 100px;
	}
	.past-past-button{
		position: relative;
		bottom: 20px;
	}
	.holding-all-students{
	    height: 550px;
		max-height: 550px;
		overflow-y: scroll;
		display: flex;
		justify-content: center;
		flex-direction: row;
		flex-wrap: wrap;
	}
	main {
		display: flex;
		gap: 40px;
		font-family: 'Roboto';
	}

	ul {
		list-style: none;
		padding: 0;
		flex-wrap: wrap;
		display: flex;
		gap: 10px;
		margin-top: 30px;
		
	}

	li {
		position: relative;
		margin-top: 30px;
		margin-bottom: 10px;
		width: 240px;
	}

	li div {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
	.the-children {
		display: flex;
		flex-direction: row;
		gap: 33px;
		max-height: 600px;
		overflow-y: auto;
		
	}
	.due-feature {
		position: relative;
		right: 9px;
		bottom: 52px;
		border: none;
	}
	.save{
		position: absolute !important;
		top: 90px;
	}

	button {
		cursor: pointer;
		border: 1px solid black;
		color: black;
		background-color: transparent;
		font-size: 14px;
		transition: background-color 0.2s ease-in-out;
	}
	button:hover{
		color: white;
		background-color: black;
	}
	.the-children::-webkit-scrollbar {
    width: 6px; /* Width of the scrollbar */
    height: 6px; /* Height of the scrollbar (if vertical) */
}

/* Thin scrollbar thumb */
.the-children::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.5); /* Color of the scrollbar thumb */
    border-radius: 3px; /* Rounded corners */
}

/* Hover effect for scrollbar thumb */
.the-children::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.7); /* Color of the scrollbar thumb on hover */
}
.holding-all-students::-webkit-scrollbar {
    width: 6px; /* Width of the scrollbar */
    height: 6px; /* Height of the scrollbar (if vertical) */
}

/* Thin scrollbar thumb */
.holding-all-students::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.5); /* Color of the scrollbar thumb */
    border-radius: 3px; /* Rounded corners */
}

/* Hover effect for scrollbar thumb */
.holding-all-students::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.7); /* Color of the scrollbar thumb on hover */
}
.edit-button{
	border: none;
}
.edit-button:hover{
	background-color: transparent;
}

@media only screen and (max-width: 768px) {
	.the-children {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        max-height: 100%; /* Ensure container doesn't exceed screen height */
        overflow-y: auto; /* Enable vertical scrolling if content exceeds container height */
        width: 80%; /* Occupy full width */
        padding: 0 10px; /* Add some horizontal padding */
        margin-top: 20px; /* Adjust top margin */
       margin-bottom: 100px;
	}

    .the-children li {
        width: 100%; /* Make each item occupy full width */
    }
	.big-container{
	  width: 90%;
	}
	.everything {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        width: 100%;
        padding: 0 10px;
		overflow-y: auto;
		
    }
	:global(body) {
		margin: 0;
		padding: 0;
		overflow-y: scroll;
		font-family: 'Roboto';
		overflow-x: hidden;
	}

	.past-student-container{
		border: 1px solid black;
		margin: 10px;
		padding: 10px;
		width: 90%;
		height: fit-content;
	}
	.past-students{
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin-top: 20px;
		width: 90%;
	}
}

</style>
