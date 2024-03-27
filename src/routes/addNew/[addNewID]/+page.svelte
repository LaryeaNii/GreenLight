<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Navbar from '../../navbar/+page.svelte';
	import { writable } from 'svelte/store';
	import supabase from '$lib/db.js';
	import { goto } from '$app/navigation';

	let addNewID; // Variable to store the addNewID parameter from the route
	let parentDetails; // Variable to store the fetched parent details
	let isLoading = false; // Flag to track loading state
	let isMounted = false;
	let isMyEditor = false;
	let showToast = false;
	let toastType = ''; // 'success' or 'failure'
	let toastMessage = '';
	let requesterMessage = '';
	let isblurry = false; 
	

	async function checkPermission() {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  const { user } = userResult;

  // Fetch the permissions array from the schools table
  const { data: schoolData, error: fetchError } = await supabase
    .from('schools')
    .select('permission')
    .eq('schoolkey', user.id)
    .single();

  if (fetchError) {
    console.error('Error fetching permissions:', fetchError.message);
    // Handle error
    return;
  }

  const permission = schoolData?.permission || [];

  // Check if the logged-in user's ID is present in the approvedby field of any permission object
  const isApprovedByUser = permission.some(permission => permission.approvedby === parentDetails.editor && permission.toUpdate === parentDetails.parent_key)  
  console.log("The user is " + isApprovedByUser)
  if (isApprovedByUser) {
    isMyEditor = true;
  } else if (user.id === parentDetails.editor) {
      isMyEditor = true;
    } else {
      isMyEditor = false; 
    }


	if (!isMyEditor) {
  // If not, blur the main container, make it read-only, and display a message
  const mainElement = document.querySelector('main');
  mainElement.style.filter = 'blur(5px)';
  mainElement.contentEditable = 'false'; // Make the content read-only
  isblurry = true;

  mainElement.addEventListener('click', preventInteraction, true);
  mainElement.addEventListener('input', preventInteraction, true);
  mainElement.addEventListener('change', preventInteraction, true);
  mainElement.addEventListener('select', preventInteraction, true);
}
function preventInteraction(event) {
  event.preventDefault();
  event.stopPropagation();
}

  }



	async function sendRequest() {
		const { data: userResult, error: userError } = await supabase.auth.getUser();
		const { user } = userResult;

		// Prepare the request object
		const request = {
			requester: user.id,
			message: `Edit ${parentDetails.parentName}: ${requesterMessage} `,
			receiver: parentDetails.editor,
			time: new Date(),
			messageID: parentDetails.parent_key
		};

		// Fetch the current requesters array from the database
		const { data: schoolData, error: fetchError } = await supabase
			.from('schools')
			.select('requesters')
			.eq('schoolkey', parentDetails.editor)
			.single();

		if (fetchError) {
			console.error('Error fetching current requesters:', fetchError.message);
			showToast = true;
			toastType = 'failure';
			toastMessage = 'Request failed. Please try again';
			setTimeout(() => {
				showToast = false; // Hide toast after a certain time
			}, 3000);
			return;
		}

		const currentRequesters = schoolData ? schoolData.requesters || [] : [];

		// Update the parent database with the appended requesters array
		const { error } = await supabase
			.from('schools')
			.update({ requesters: [...currentRequesters, request] }) // Append the new request to the current requesters array
			.eq('schoolkey', parentDetails.editor);

		if (error) {
			console.error('Error sending request:', error.message);
			showToast = true;
			toastType = 'failure';
			toastMessage = 'Request failed. Please try again';
			setTimeout(() => {
				showToast = false; // Hide toast after a certain time
			}, 3000);
		} else {
			console.log('Request sent successfully.');
			// Handle success
			goto('/permissions');
		}
	}

	let maritalCategory = [
		{ factor: 'Unknown', defaultRate: null, factorWeight: 1 },
		{ factor: 'Married', defaultRate: 14.8 / 100, factorWeight: 1 / (14.8 / 100) },
		{ factor: 'Not Married', defaultRate: 17.8 / 100, factorWeight: 1 / (17.8 / 100) }
	];

	let numberofDependentsCategory = [
		{ factor: 'Unknown', defaultRate: null, factorWeight: 1 },
		{ factor: '1-2', defaultRate: 24.1 / 100, factorWeight: 1 / (24.1 / 100) },
		{ factor: 'More than 2', defaultRate: 31.5 / 100, factorWeight: 1 / (31.5 / 100) }
	];

	let highestEducationCategory = [
		{ factor: 'Unknown', defaultRate: null, factorWeight: 1 },
		{
			factor: 'Did not attend/complete high school',
			defaultRate: 56.2 / 100,
			factorWeight: 1 / (56.2 / 100)
		},
		{ factor: 'No Degree', defaultRate: 32.6 / 100, factorWeight: 1 / (32.6 / 100) },
		{
			factor: 'Tertiary Certificate (two-years or less)',
			defaultRate: 28.5 / 100,
			factorWeight: 1 / (28.5 / 100)
		},
		{
			factor: 'Higher National Diploma (HND)',
			defaultRate: 13.3 / 100,
			factorWeight: 1 / (13.3 / 100)
		},
		{ factor: "Bachelor's", defaultRate: 8.2 / 100, factorWeight: 1 / (8.2 / 100) },
		{
			factor: "Tertiary Certificate (Master's and Above)",
			defaultRate: 6.1 / 100,
			factorWeight: 1 / (6.1 / 100)
		}
	];

	let monthlyIncomeCategory = [
		{ factor: 'Unknown', defaultRate: null, factorWeight: 1 },
		{ factor: 'GHS 200 or less', defaultRate: 36 / 100, factorWeight: 1 / (36 / 100) },
		{ factor: 'GHS 201- GHS 400', defaultRate: 22 / 100, factorWeight: 1 / (22 / 100) },
		{ factor: 'GHS 401 - GHS 600', defaultRate: 16.5 / 100, factorWeight: 1 / (16.5 / 100) },
		{ factor: 'More than GHS 601', defaultRate: 8 / 100, factorWeight: 1 / (8 / 100) }
	];

	let paymentCategory = [
		{ factor: 0, factorWeight: 1 },
		{ factor: 1, factorWeight: 0.7 },
		{ factor: 2, factorWeight: 0.4 },
		{ factor: 3, factorWeight: 0.1 }
	];

	const maritalCategoryWeight =
		maritalCategory.reduce((sum, obj) => sum + obj.factorWeight, 0) / maritalCategory.length;

	const numberofDependentsCategoryWeight =
		numberofDependentsCategory.reduce((sum, obj) => sum + obj.factorWeight, 0) /
		numberofDependentsCategory.length;

	const highestEducationCategoryWeight =
		highestEducationCategory.reduce((sum, obj) => sum + obj.factorWeight, 0) /
		highestEducationCategory.length;

	const monthlyIncomeCategoryWeight =
		monthlyIncomeCategory.reduce((sum, obj) => sum + obj.factorWeight, 0) /
		monthlyIncomeCategory.length;

	// Calculate minimum score
	const minimumScore =
		maritalCategory.reduce((min, obj) => (obj.factorWeight < min ? obj.factorWeight : min), 1) *
			maritalCategoryWeight +
		numberofDependentsCategory.reduce(
			(min, obj) => (obj.factorWeight < min ? obj.factorWeight : min),
			1
		) *
			numberofDependentsCategoryWeight +
		highestEducationCategory.reduce(
			(min, obj) => (obj.factorWeight < min ? obj.factorWeight : min),
			1
		) *
			highestEducationCategoryWeight +
		monthlyIncomeCategory.reduce(
			(min, obj) => (obj.factorWeight < min ? obj.factorWeight : min),
			1
		) *
			monthlyIncomeCategoryWeight;

	// Calculate maximum score
	const maximumScore =
		maritalCategory.reduce((max, obj) => (obj.factorWeight > max ? obj.factorWeight : max), 0) *
			maritalCategoryWeight +
		numberofDependentsCategory.reduce(
			(max, obj) => (obj.factorWeight > max ? obj.factorWeight : max),
			0
		) *
			numberofDependentsCategoryWeight +
		highestEducationCategory.reduce(
			(max, obj) => (obj.factorWeight > max ? obj.factorWeight : max),
			0
		) *
			highestEducationCategoryWeight +
		monthlyIncomeCategory.reduce(
			(max, obj) => (obj.factorWeight > max ? obj.factorWeight : max),
			0
		) *
			monthlyIncomeCategoryWeight;

	const minMultiplier = 1 - 3 * 0.3;
	const maxMultiplier = 1 - 0 * 0.3;

	const adjustedMinimumScore = minimumScore * minMultiplier;

	// Adjusted maximum score
	const adjustedMaximumScore = maximumScore * maxMultiplier;

	let selectedValues = {
		maritalStatus: 1,
		numDependents: 1,
		education: 1,
		income: 1
	};

	let realValues = {
		maritalStatus: 'Unknown',
		numDependents: 'Unknown',
		education: 'Unknown',
		income: 'Unknown'
	};

	let creditScore;
	let defaultCount = 0;
	let defaultCountFactorWeight = 1;
	let individualScore;

	individualScore =
		selectedValues.maritalStatus * maritalCategoryWeight +
		selectedValues.numDependents * numberofDependentsCategoryWeight +
		selectedValues.education * highestEducationCategoryWeight +
		selectedValues.income * monthlyIncomeCategoryWeight * defaultCountFactorWeight;

	console.log('Married Value ' + selectedValues.maritalStatus * maritalCategoryWeight);
	console.log('dependent Value ' + selectedValues.numDependents * numberofDependentsCategoryWeight);
	console.log('income value ' + selectedValues.income * monthlyIncomeCategoryWeight);
	console.log('education value ' + selectedValues.education * highestEducationCategoryWeight);
	console.log('Individual Score: ' + individualScore);
	console.log('Default Count value: ' + defaultCountFactorWeight);

	let normalScore =
		(individualScore - adjustedMinimumScore) / (adjustedMaximumScore - adjustedMinimumScore);

	let maxRange = 850;
	let minRange = 300;

	creditScore = Math.round(normalScore * (maxRange - minRange) + minRange);

	console.log('Credit Score: ' + creditScore);

	function calculateScores() {
		individualScore =
			selectedValues.maritalStatus * maritalCategoryWeight +
			selectedValues.numDependents * numberofDependentsCategoryWeight +
			selectedValues.education * highestEducationCategoryWeight +
			selectedValues.income * monthlyIncomeCategoryWeight * defaultCountFactorWeight;

		console.log('Married Value ' + selectedValues.maritalStatus * maritalCategoryWeight);
		console.log(
			'dependent Value ' + selectedValues.numDependents * numberofDependentsCategoryWeight
		);
		console.log('income value ' + selectedValues.income * monthlyIncomeCategoryWeight);
		console.log('education value ' + selectedValues.education * highestEducationCategoryWeight);
		console.log('Individual Score: ' + individualScore);
		console.log('Default Count value: ' + defaultCountFactorWeight);

		let normalScore =
			(individualScore - adjustedMinimumScore) / (adjustedMaximumScore - adjustedMinimumScore);

		let maxRange = 850;
		let minRange = 300;

		creditScore = Math.round(normalScore * (maxRange - minRange) + minRange);

		console.log('Credit Score: ' + creditScore);
	}

	// Function to fetch parent details based on the addNewID
	async function fetchParentDetails() {
		isLoading = true; // Set loading flag to true

		const { data, error } = await supabase
			.from('parent')
			.select(` *,  student (*)`)
			.eq('parent_key', addNewID);

		if (error) {
			console.error('Error fetching parent and student details:', error.message);
			return;
		}

		parentDetails = data[0]; // Store the fetched parent details
		console.log(parentDetails);
		isLoading = false; // Set loading flag to false

		selectedValues = {
			maritalStatus:
				maritalCategory.find((c) => c.factor === parentDetails.marital_status)?.factorWeight || 1,
			numDependents:
				numberofDependentsCategory.find((c) => c.factor === parentDetails.numberofDependents)
					?.factorWeight || 1,
			education:
				highestEducationCategory.find((c) => c.factor === parentDetails.highest_education)
					?.factorWeight || 1,
			income:
				monthlyIncomeCategory.find((c) => c.factor === parentDetails.income)?.factorWeight || 1
		};
		realValues = {
			maritalStatus:
				maritalCategory.find((c) => c.factorWeight === selectedValues.maritalStatus)?.factor ||
				'Unknown',
			numDependents:
				numberofDependentsCategory.find((c) => c.factorWeight === selectedValues.numDependents)
					?.factor || 'Unknown',
			education:
				highestEducationCategory.find((c) => c.factorWeight === selectedValues.education)?.factor ||
				'Unknown',
			income:
				monthlyIncomeCategory.find((c) => c.factorWeight === selectedValues.income)?.factor ||
				'Unknown'
		};
	}

	onMount(async () => {
		addNewID = $page.params.addNewID; // Get the addNewID from the route parameters using page store
		 
		await fetchParentDetails();
		checkPermission();
		calculateScores();
		isMounted = true;
	});

	function updateRealValues() {
		realValues = {
			maritalStatus:
				maritalCategory.find((c) => c.factorWeight === selectedValues.maritalStatus)?.factor ||
				'Unknown',
			numDependents:
				numberofDependentsCategory.find((c) => c.factorWeight === selectedValues.numDependents)
					?.factor || 'Unknown',
			education:
				highestEducationCategory.find((c) => c.factorWeight === selectedValues.education)?.factor ||
				'Unknown',
			income:
				monthlyIncomeCategory.find((c) => c.factorWeight === selectedValues.income)?.factor ||
				'Unknown'
		};
		calculateScores();
	}

	const newStudentName = writable('');
	const addedStudents = writable([]);

	function addNewStudent() {
		if ($newStudentName.trim() !== '') {
			addedStudents.update((students) => [...students, $newStudentName]);
			newStudentName.set('');
		}
	}

	async function saveChanges() {
		const { data: userResult, error: userError } = await supabase.auth.getUser();

		const { user } = userResult;

		// 1. Update parent data using realValues
		const { error: parentUpdateError } = await supabase
			.from('parent')
			.update({
				marital_status: realValues.maritalStatus,
				numberofDependents: realValues.numDependents,
				highest_education: realValues.education,
				income: realValues.income,
				base_credit_score: creditScore,
				individualScore: individualScore
			})
			.eq('parent_key', parentDetails.parent_key);

		if (parentUpdateError) {
			console.error('Error updating parent data:', parentUpdateError.message);
			showToast = true;
			toastType = 'failure';
			toastMessage = 'Error inserting data. Please refresh and try again.';
			return;
			return;
		}

		const { error: studentUpdateError } = await supabase
			.from('student')
			.update({ individualScore })
			.eq('parent', parentDetails.parent_key);

		if (studentUpdateError) {
			console.error('Error updating existing students:', studentUpdateError.message);
			showToast = true;
			toastType = 'failure';
			toastMessage = 'Error inserting data. Please refresh and try again.';
			return;
		} else {
			await fetchParentDetails();
		}

		// 3. Insert added students into the database
		const studentsToInsert = $addedStudents.map((studentName) => ({
			studentName: studentName,
			parent: parentDetails.parent_key,
			credit_score: creditScore,
			individualScore: individualScore,
			studentSchool: user.id,
			default_count: [{ count: 0, school: user.id }]
		}));

		const { error: studentInsertError } = await supabase.from('student').insert(studentsToInsert);

		if (studentInsertError) {
			console.error('Error inserting new students:', studentInsertError.message);
		} else {
			addedStudents.set([]); // Reset the addedStudents store
			await fetchParentDetails();
		}
		updateCreditScores();
		fetchParentDetails();
		showToast = true;
		toastType = 'success';
		toastMessage = 'Students added successfully.';
		setTimeout(() => {
			showToast = false; // Hide toast after a certain time
		}, 3000);
	}

	async function updateCreditScores() {
		// Iterate through each student belonging to the parent
		for (const student of parentDetails.student) {
			let minScore = 1.9104383778608123;
			let maxScore = 215.3166579833824;
			let maxVal = 850;
			let minVal = 300;
			const individualScore = student.individualScore;
			let oldData = 0;

			// Filter out counts that do not belong to the schoolID and sum the counts
			student.default_count.forEach((count) => {
				oldData += count.count;
				console.log('Count value for student ' + student.studentkey + ': ' + count.count);
			});

			console.log('Total of default counts for student ' + student.studentkey + ': ' + oldData);

			// Define payment categories and their corresponding factor weights
			const paymentCategory = [
				{ factor: 0, factorWeight: 1 },
				{ factor: 1, factorWeight: 0.7 },
				{ factor: 2, factorWeight: 0.4 },
				{ factor: 3, factorWeight: 0.1 }
			];

			// Find the factor weight based on the default count
			let defaultCountFactorWeight;
			if (oldData >= paymentCategory.length) {
				defaultCountFactorWeight = paymentCategory[paymentCategory.length - 1].factorWeight;
			} else {
				defaultCountFactorWeight = paymentCategory[oldData].factorWeight;
			}

			// Calculate new individual score based on default count
			let newIndividualScore = individualScore * defaultCountFactorWeight;
			console.log(
				'Total count weight for student ' + student.studentkey + ': ' + defaultCountFactorWeight,
				'Individual score for student ' + student.studentkey + ': ' + individualScore,
				'New individual score for student ' + student.studentkey + ': ' + newIndividualScore
			);

			// Update the student's credit score
			let newCreditScore = Math.round(
				((newIndividualScore - minScore) / (maxScore - minScore)) * (maxVal - minVal) + minVal
			);
			console.log('The new credit score for student ' + student.studentkey + ': ' + newCreditScore);

			// Update the credit score in the parentDetails object
			student.credit_score = newCreditScore;

			// Update the credit score in the database (if needed)
			// Here you would typically have code to update the credit score in your database
			// This depends on how your database is structured and accessed

			const { error } = await supabase
				.from('student')
				.update({ credit_score: newCreditScore })
				.eq('studentkey', student.studentkey);

			if (error) {
				console.error(
					'Error updating credit score for student',
					student.studentkey,
					':',
					error.message
				);
			} else {
				console.log('Credit score updated for student', student.studentkey);
			}
		}
	}
</script>

<main>
	<Navbar active={2} />
	{#if !isMounted}
		<h1 class="middleofpage">Loading...</h1>
	{:else}
		{#if !isblurry}
			<div class="categories">
				<h1>Edit "{parentDetails.parentName}"</h1>
				<div class="form-container">
					<label for="maritalStatus">Marital Status:</label>
					<select
						id="maritalStatus"
						bind:value={selectedValues.maritalStatus}
						on:change={updateRealValues}
					>
						{#each maritalCategory as category}
							<option
								value={category.factorWeight}
								selected={category.factor === realValues.maritalStatus}
							>
								{category.factor}
							</option>
						{/each}
					</select>

					<label for="numDependents">Number of Dependents:</label>
					<select
						id="numDependents"
						bind:value={selectedValues.numDependents}
						on:change={updateRealValues}
					>
						{#each numberofDependentsCategory as category}
							<option
								value={category.factorWeight}
								selected={category.factor === realValues.numDependents}
							>
								{category.factor}
							</option>
						{/each}
					</select>

					<label for="education">Highest Education:</label>
					<select id="education" bind:value={selectedValues.education} on:change={updateRealValues}>
						{#each highestEducationCategory as category}
							<option
								value={category.factorWeight}
								selected={category.factor === realValues.education}
							>
								{category.factor}
							</option>
						{/each}
					</select>

					<label for="income">Income:</label>
					<select id="income" bind:value={selectedValues.income} on:change={updateRealValues}>
						{#each monthlyIncomeCategory as category}
							<option
								value={category.factorWeight}
								selected={category.factor === realValues.income}
							>
								{category.factor}
							</option>
						{/each}
					</select>
				</div>
			</div>
		{/if}
          {#if !isblurry}
		<div class="student-container">
			{#if parentDetails && parentDetails.student}
				<h2>{`${parentDetails.parentName}'s Children`}</h2>
				{#each parentDetails.student as student}
					<p>{student.studentName} ({student.studentkey})</p>
				{/each}
			{:else}
				<p>No students found.</p>
			{/if}

			<br />
			<h2>Add Children</h2>
			{#each $addedStudents as student}
				<p>{student}</p>
			{/each}
			<div class="add-new-student">
				<input type="text" placeholder="Add New Student" bind:value={$newStudentName} />
				<button on:click={addNewStudent}>Add New</button>
			</div>
		</div>
		
		<button class="final-button" on:click={saveChanges}>Save All Changes</button>
		{/if}
	{/if}
</main>

{#if isblurry && isMounted}
	<div class="blur-container">
		<div class="permission-message">
			<h1>You do not have permission to edit this page.</h1>
			<input type="text" placeholder="Reason for request (Keep It Brief!)"  bind:value={requesterMessage}/>
			<button on:click={sendRequest}>Request Permission</button>
		</div>
	</div>
{/if}
{#if showToast}
	<div class="toast {toastType}">
		<p>{toastMessage}</p>
	</div>
{/if}

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
	.categories {
		display: flex;
		flex-direction: column;
	}
	.form-container {
		display: flex;
		flex-direction: column;
		width: 500px; /* Adjust width as needed */
		background-color: #f2f2f2;
		border-radius: 5px;
		padding: 20px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		height: 550px;
		justify-content: space-evenly;
	}
	select {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
		font-size: 16px;
		width: 100%;
	}
	input {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
		font-size: 16px;
		width: 60%;
	}
	.student-container {
		margin-top: 15px;
		margin-left: 120px;
	}
	button {
		padding: 10px 20px;
		border: 1px solid grey;
		border-radius: 5px;
		background-color: transparent;
		color: black;
		font-size: 16px;
		cursor: pointer;
		transition: background-color 0.2s ease-in-out;
		margin: 3px;
	}

	button:hover {
		background-color: #ccc;
	}
	.add-new-student {
		display: flex;
	}
	.final-button {
		position: absolute;
		bottom: 70px;
		left: 930px;
		width: 500px;
		background-color:white;
	}
	.final-button:hover {
		background-color:  #f3f0f0;
	
	}
	/* CSS for blur effect */
	.blur-container {
		position: absolute;
		top: 40%;
		left: 25%;
		width: 890px;
		background-color: rgb(229, 229, 229);
		font-family: 'Poppins';
		display: flex;
		justify-content: center;
		padding: 10px;
	}

	/* CSS for permission message */
	.permission-message input {
		margin-bottom: 10px;
	}

	.permission-message button {
		padding: 10px 20px;
		border: 1px solid grey;
		border-radius: 5px;
		background-color: transparent;
		color: black;
		font-size: 16px;
		cursor: pointer;
		transition: background-color 0.2s ease-in-out;
		margin: 3px;
	}
	.permission-message button:hover {
		background-color: #ccc;
	}
</style>
