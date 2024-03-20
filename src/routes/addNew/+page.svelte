<script>
	import Navbar from '../navbar/+page.svelte';
	import supabase from '$lib/db.js';

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

		console.log('Factor Weight for Default Count: ' + defaultCountFactorWeight);

		// Log other selected values if needed
		console.log('Selected Values:', selectedValues);

		// Calculate individual score
		let individualScore =
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
        console.error('Error fetching user data:', userError.message);
        return;
    }

    const { user } = userResult;

    const parentData = {
        parentName: parentName,
        school: user.id,
        numberofDependents: realValues.numDependents,
        income: realValues.income,
        marital_status: realValues.maritalStatus,
        highest_education: realValues.education,
        credit_score: creditScore,
        default_count: [{ count: defaultCount, school: user.id }]
    };

    const { data: newData,  error: insertError } = await supabase.from('parent').insert([parentData]).select();

    if (insertError) {
        console.error('Error inserting parent data:', insertError.message);
        return;
    }else{
		console.log('Data Insert Success')
		console.log(newData[0].parent_key);
	}
      
	const parentKey = newData[0].parent_key; // Assuming 'parent_key' is the name of the primary key column in the 'parent' table

const studentData = {
	studentName: studentName,
	parent: parentKey
};

const { data: studentResult, error: studentError } = await supabase.from('student').insert([studentData]);

if (studentError) {
	console.error('Error inserting student data:', studentError.message);
	return;
}

console.log('Parent and student data inserted successfully.');

   

}

</script>

<main>
	<Navbar active={2} />

	<div class="form-container">
		<form class="form" on:submit={handleSubmit}>
			<div class="input-group">
				<label for="parentName">Parent Name:</label>
				<input
					type="text"
					id="parentName"
					bind:value={parentName}
					placeholder="Mr Michael Mensah"
				/>
			</div>
			<div class="input-group">
				<label for="studentName">Name of Student:</label>
				<input type="text" id="studentName" bind:value={studentName} placeholder="Henry Mensah" />
			</div>
			<div class="select-group">
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
			<div class="select-group">
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
			<div class="input-group">
				<label for="defaultCount">Default Count:</label>
				<div>
					<input type="text" id="defaultCount" bind:value={defaultCount} readonly />
					<button type="button" on:click={increaseDefaultCount}>+</button>
					<button type="button" on:click={decreaseDefaultCount}>-</button>
				</div>
			</div>
			<button type="submit">Submit</button>
		</form>
	</div>
</main>

<style>
	main {
		display: flex;
		gap: 40px;
		font-family: 'Poppins', sans-serif;
	}

	.form-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 500px; /* Adjust width as needed */
		background-color: #f2f2f2;
		border-radius: 5px;
		padding: 20px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.input-group,
	.select-group {
		display: flex;
		flex-direction: column;
		align-items: left;
		gap: 10px;
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
		width: 100%; /* Adjust width as needed */
	}

	.form button {
		padding: 10px 20px;
		border: none;
		border-radius: 5px;
		background-color: #333;
		color: #fff;
		font-size: 16px;
		cursor: pointer;
		transition: background-color 0.2s ease-in-out;
	}

	.form button:hover {
		background-color: #222;
	}
</style>
