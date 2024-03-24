<script>
	import Navbar from '../navbar/+page.svelte';
	import supabase from '$lib/db.js';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let minScore = 1.9104383778608123;
	let maxScore = 215.3166579833824;
	let maxVal = 850;
	let minVal = 300;
	const schoolData = writable([]);

    
	let showToast = false;
	let toastType = ''; // 'success' or 'failure'
	let toastMessage = '';

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
					default_count: student.default_count
				})
				.eq('studentkey', student.studentkey);
			console.log('Changes saved successfully.');
            showToast = true;
		toastType = 'success';
		toastMessage = 'Changes saved successfully.';
		setTimeout(() => {
			showToast = false; // Hide toast after a certain time
		}, 3000);
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
		if (index !== -1) {
			theCount = student.default_count[index].count++ + 1;
			console.log('I owe ' + theCount);
			// Recalculate credit score after increasing count
			updateCreditScore(student);
			// Update the schoolData store to reflect the changes
			schoolData.update((data) => [...data]);
		}
	}
	function decreaseCount(student, schoolId) {
		const index = student.default_count.findIndex((count) => count.school === schoolId);
		if (index !== -1) {
			theCount = student.default_count[index].count-- - 1; // Decrement count
			console.log('I paid ' + theCount);
			// Ensure count doesn't go below zero

			// Recalculate credit score and update store
			updateCreditScore(student);
			schoolData.update((data) => [...data]);
		}
	}

	let newIndividualScore;
	function updateCreditScore(student) {
		const individualScore = student.individualScore;
		const defaultCount = theCount;

		// Define payment categories and their corresponding factor weights
		const paymentCategory = [
			{ factor: 0, factorWeight: 1 },
			{ factor: 1, factorWeight: 0.7 },
			{ factor: 2, factorWeight: 0.4 },
			{ factor: 3, factorWeight: 0.1 }
		];

		// Find the factor weight based on the default count
		let defaultCountFactorWeight;
		if (defaultCount >= paymentCategory.length) {
			defaultCountFactorWeight = paymentCategory[paymentCategory.length - 1].factorWeight;
		} else {
			defaultCountFactorWeight = paymentCategory[defaultCount].factorWeight;
		}

		// Calculate new individual score based on default count
		newIndividualScore = individualScore * defaultCountFactorWeight;
		console.log(
			'default count: ' + defaultCountFactorWeight,
			'individual score ' + individualScore,
			'newIndividual ' + newIndividualScore
		);

		// Update the student's credit score
		const newCreditScore = Math.round(
			((newIndividualScore - minScore) / (maxScore - minScore)) * (maxVal - minVal) + minVal
		);
		console.log('The new credit score ' + newCreditScore);
		student.credit_score = newCreditScore;
	}
</script>

<main>
	<Navbar active={4} />
	<div class="everything">
		<h1>My Students</h1>
		<div class="the-children">
			{#each $schoolData as school}
				<div>
					<ul>
						{#each school.student as student}
							<li>
								<div>
									<!-- svelte-ignore a11y-click-events-have-key-events -->
									<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
									<p on:click={() => (student.showDetails = !student.showDetails)}>
										{student.studentName} (Student ID: {student.studentkey})
									</p>
									{#if student.showDetails}
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
														<button on:click={() => decreaseCount(student, school.schoolkey)}>
															-
														</button>
													</li>
                                                    <button on:click={() => saveChanges(student)}>Save Changes</button>
                                                </div>	
                                               
												{/if}
											{/each}
										</ul>
									{/if}
									
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
    {#if showToast}
		<div class="toast {toastType}">
			<p>{toastMessage}</p>
		</div>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
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
	}


	main {
		display: flex;
		gap: 40px;
		font-family: 'Poppins';
	}

	ul {
		list-style: none;
		padding: 0;
		flex-wrap: wrap;
		display: flex;
		gap: 20px;
        margin-left: 130px;
	}

	li {
		margin-bottom: 10px;
	}


	li div {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
	.the-children {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%; /* Set the width to 100% */
    max-width: 1200px; /* Set a maximum width */
    gap: 20px; 
    position: static; /* Remove the positioning */
    top: 0; 
    left: 0;
    max-height: 700px;
    overflow-y: auto;
}
.due-feature{
  position: relative;
  right: 139px;
  bottom: 10px;    
  border: none;
}
button{
    cursor: pointer;
    border: none;
    color: black;
    background-color: beige;
    font-size: 14px;
}
</style>
