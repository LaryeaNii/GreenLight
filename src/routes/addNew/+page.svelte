<script>
	import Navbar from '../navbar/+page.svelte';
	import supabase from '$lib/db.js';
	import deleteMe from '$lib/delete-svgrepo-com.svg';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
 
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
		maritalStatus: null,
		numDependents: null,
		education: null,
		income: null
	};

	let creditScore;
	let parentName;
	let studentName;

	let defaultCount = 0;
	let defaultCountFactorWeight = null; // Variable to store the factor weight for default count
   let individualScore;

	let showToast = false;
	let toastType = ''; // 'success' or 'failure'
	let toastMessage = '';

	function increaseDefaultCount() {
		defaultCount++;
	}
	function decreaseDefaultCount() {
		if (defaultCount > 0) {
			defaultCount--;
		}
	}

	async function handleSubmit(event) {
		event.preventDefault();
		// Calculate the factor weight for default count
		if (defaultCount >= paymentCategory.length) {
			defaultCountFactorWeight = paymentCategory[paymentCategory.length - 1].factorWeight;
		} else {
			defaultCountFactorWeight = paymentCategory[defaultCount].factorWeight;
		}

		if ($studentNames.length === 0) {
			showToast = true;
			toastType = 'failure';
			toastMessage = 'Please add at least one student.';
			setTimeout(() => {
			showToast = false; // Hide toast after a certain time
		}, 3000);
			return;
		}

		console.log('Factor Weight for Default Count: ' + defaultCountFactorWeight);

		// Log other selected values if needed
		console.log('Selected Values:', selectedValues);

		// Calculate individual score
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

		let normalScore =
			(individualScore - adjustedMinimumScore) / (adjustedMaximumScore - adjustedMinimumScore);

		let maxRange = 850;
		let minRange = 300;
		
		creditScore = Math.round(normalScore * (maxRange - minRange) + minRange);

		console.log('Credit Score: ' + creditScore);

		await addParentStudent();
		let theform = document.getElementById('formy');
		theform.reset();
		handleReset();
		defaultCount = 0;
	}

	function handleSelectChange(event, field) {
		selectedValues[field] = event.target.value;
		console.log(`${field}: ${selectedValues[field]}`);
		realValues[field] = event.target.options[event.target.selectedIndex].text; // Store the selected option text
		console.log(`Real ${field}: ${realValues[field]}`);
	}

	async function addParentStudent() {
		const { data: userResult, error: userError } = await supabase.auth.getUser();

		if (userError) {
			showToast = true;
			toastType = 'failure';
			toastMessage = 'Error inserting data. Please refresh and try again.';
			console.error('Error fetching user data:', userError.message);
			return;
		}

		const { user } = userResult;

		const parentData = {
			parentName: parentName,
			editor: user.id,
			numberofDependents: realValues.numDependents,
			income: realValues.income,
			marital_status: realValues.maritalStatus,
			highest_education: realValues.education,
			individualScore: individualScore, 
			base_credit_score: creditScore,

		};

		const { data: newData, error: insertError } = await supabase
			.from('parent')
			.insert([parentData])
			.select();

		if (insertError) {
			console.error('Error inserting parent data:', insertError.message);
			return;
		} else {
			console.log('Data Insert Success');
			console.log(newData[0].parent_key);
		}

		const parentKey = newData[0].parent_key;

		for (const student of $studentNames) {
			const studentData = {
				studentName: student,
				credit_score: creditScore,
		        individualScore: individualScore, 
				studentSchool: user.id,
				default_count: [{ count: defaultCount, school: user.id }],
				parent: parentKey // Use the parent key obtained from the previous insertion
			};

			const { data: studentResult, error: studentError } = await supabase
				.from('student')
				.insert([studentData]);

			if (studentError) {
				console.error('Error inserting student data:', studentError.message);
				showToast = true;
				toastType = 'failure';
				toastMessage = 'Error inserting data. Please refresh and try again.';
				return;
			}

			console.log(`Student "${student}" added successfully.`);
		}

		showToast = true;
		toastType = 'success';
		toastMessage = 'Students added successfully.';
		setTimeout(() => {
			showToast = false; // Hide toast after a certain time
		}, 3000);
	}

	// Create a writable store for studentNames
	const studentNames = writable([]);

	// Function to add student
	function addStudent() {
		if (studentName.trim() !== '') {
			// Update the studentNames store by pushing the new student name
			studentNames.update((names) => [...names, studentName]);
			// Clear the input field after adding the student
			studentName = '';
		}
	}
	function removeStudent(index) {
		// Remove the student at the specified index from the studentNames array
		$studentNames.splice(index, 1);
		studentNames.update((names) => [...names]);
	}

	function handleReset() {
		// Clear the studentNames array
		studentNames.set([]);
		// Additional logic if needed...
	}


	
	const parentData = writable([]);
	async function fetchParentData() {
		let { data, error } = await supabase
  .from('parent')
  .select(`
    parentName, 
	parent_key,
    student (
      parent, studentName, studentkey
    )
  `)
    if (error) {
        console.error('Error fetching parent data:', error.message);
        return;
    }

    // Log the fetched data
    console.log('Fetched parent data with associated students:', data);

    // Update the parentData store with parent names and their associated students
    parentData.set(data);
}

	onMount(fetchParentData);
	let suggestedNames = [];
	// Function to filter similar names based on the input

	function filterSimilarNames(input) {
  const inputValue = input.trim().toLowerCase();
  console.log('Searching ' + inputValue);
  // Reset the suggestedNames array
  suggestedNames = [];

  // Filter parent data to find similar names
  $parentData.forEach((item) => {
    const parentName = item.parentName ? item.parentName.toLowerCase() : '';

	if (parentName.includes(inputValue)) {
      // Get the associated student data from the nested object
      const students = item.student;
      // Add the parent name and associated student data to the suggestedNames array
      suggestedNames.push({
        parentName: item.parentName,
		parent_key: item.parent_key,
        students: students.map((student) => ({
          studentName: student.studentName,
          studentkey: student.studentkey
        }))
      });
    }
  });

  console.log('Suggested names:', suggestedNames);
}	
</script>

<main>
	<Navbar active={2} />

	<div class="form-container">
		<form class="form" id="formy" on:submit={handleSubmit}>
			<div class="info-time">
				<div class="input-group">
					<label for="parentName">Parent Name:</label>
					<input
						type="text"
						id="parentName"
						bind:value={parentName}
						placeholder="Mr Michael Mensah"
						on:input={() => filterSimilarNames(parentName)}
					/>
				</div>
				<div class="input-group">
					<label for="studentName">Name of Student:</label>
					<div class="addStudent">
						<input
							type="text"
							id="studentName"
							bind:value={studentName}
							placeholder="Henry Mensah"
						/>
						<button type="button" on:click={addStudent}>Add Student</button>
					</div>
				</div>
				<div class="names-container">
					<h2>Added Students:</h2>

					<div class="added-students-container">
						<ul>
							{#each $studentNames as student, index}
								<li>
									{student}
									<button type="button" class="deleteButton" on:click={() => removeStudent(index)}>
										<img src={deleteMe} alt="deleteImage" />
									</button>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>

			<div class="selection-time">
				<div class="select-group" id="mari-dep">
					<div class="label-select">
						<label for="maritalStatus">Marital Status:</label>
						<select
							id="maritalStatus"
							name="maritalStatus"
							on:change={(event) => handleSelectChange(event, 'maritalStatus')}
						>
							{#each maritalCategory as category}
								<option value={category.factorWeight}>{category.factor}</option>
							{/each}
						</select>
					</div>

					<div class="label-select">
						<div class="label-select">
							<label for="education">Highest Education:</label>
							<select
								id="education"
								name="education"
								on:change={(event) => handleSelectChange(event, 'education')}
							>
								{#each highestEducationCategory as category}
									<option value={category.factorWeight}>{category.factor}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>

				<div class="select-group" id="mari-bra">
					<div class="label-select">
						<label for="numDependents">Number of Dependents:</label>
						<select
							id="numDependents"
							name="numDependents"
							on:change={(event) => handleSelectChange(event, 'numDependents')}
						>
							{#each numberofDependentsCategory as category}
								<option value={category.factorWeight}>{category.factor}</option>
							{/each}
						</select>
					</div>

					<div class="label-select">
						<label for="income">Income Bracket:</label>
						<select
							id="income"
							name="income"
							on:change={(event) => handleSelectChange(event, 'income')}
						>
							{#each monthlyIncomeCategory as category}
								<option value={category.factorWeight}>{category.factor}</option>
							{/each}
						</select>
					</div>
				</div>
				
				<button type="submit">Submit</button>
			</div>
		</form>
	</div>
	{#if showToast}
		<div class="toast {toastType}">
			<p>{toastMessage}</p>
		</div>
	{/if}
	<div class="names-container">
		<h2>Are you looking for:</h2>
		<div class="suggestion-box">
			{#if suggestedNames.length > 0}
				<ul>
					{#each suggestedNames as suggestion}
						<li class="suggested-item">
							{suggestion.parentName} (ID:{suggestion.parent_key})

							<ul>
								{#each suggestion.students as student}
									<li>{student.studentName} (Student ID: {student.studentkey})</li>
								{/each}
							</ul>
						</li>
					{/each}
				</ul>
			{:else}
				<p>No suggested names found.</p>
			{/if}
		</div>
	</div>
	
</main>

<style>

:global(body) {
    margin: 0;
    padding: 0;
  }
	.suggestion-box{
		max-height: 600px;
		overflow-y: auto;
	}
	.added-students-container {
		margin-top: -29px;
		max-height: 100px; /* Set the maximum height as needed */
		overflow-y: auto; /* Enable vertical scrolling */
	}
	.suggested-item{
		margin-bottom: 17px;
	}
	.selection-time {
		display: flex;
		width: max-content;
		flex-direction: column;
		gap: 20px;
		position: absolute;
		bottom: 20px;
	}
	.label-select {
		display: flex;
		flex-direction: column;
	}

	.deleteButton {
		border: none !important;
	}
	.addStudent {
		display: flex;
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
		
		font-family: 'Poppins', sans-serif;
	}

	.form-container {
		display: flex;
		flex-direction: column;
		width: 500px; /* Adjust width as needed */
		background-color: #f2f2f2;
		border-radius: 5px;
		padding: 20px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.form {
		display: flex;
		flex-direction: column;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		margin-top: 20px;
	}
	.select-group {
		display: flex;
		flex-direction: column;
		align-items: left;
		gap: 20px;
		justify-content: space-evenly;
	}
	#mari-dep {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	label {
		color: #333;
		font-weight: bold;
	}

	.form input[type='text'] {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
		font-size: 16px;
	}

	.form select {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
		font-size: 16px;
		width: 100%;
	}

	.form button {
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

	.form button:hover {
		background-color: #ccc;
	}
	.names-container{
		padding-left: 27px;
	}
</style>
