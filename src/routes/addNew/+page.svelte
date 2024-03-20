<script>
	import Navbar from '../navbar/+page.svelte';

	let maritalCategory = [
		{ factor: '-------', defaultRate: null, factorWeight: 1 },
		{ factor: 'Married', defaultRate: 14.8 / 100, factorWeight: 1 / (14.8 / 100) },
		{ factor: 'Not Married', defaultRate: 17.8 / 100, factorWeight: 1 / (17.8 / 100) }
	];

	let numberofDependentsCategory = [
		{ factor: '-------', defaultRate: null, factorWeight: 1 },
		{ factor: '1-2', defaultRate: 24.1 / 100, factorWeight: 1 / (24.1 / 100) },
		{ factor: 'More than 2', defaultRate: 31.5 / 100, factorWeight: 1 / (31.5 / 100) }
	];

	let highestEducationCategory = [
		{ factor: '-------', defaultRate: null, factorWeight: 1 },
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
		{ factor: '-------', defaultRate: null, factorWeight: 1 },
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

	let defaultCount = 0;
	let defaultCountFactorWeight = null; // Variable to store the factor weight for default count

	function increaseDefaultCount() {
		defaultCount++;
	}

	function handleSubmit(event) {
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

        let creditScore = Math.round(normalScore * (maxRange - minRange) + minRange);

		console.log('Credit Score: ' + creditScore);

		// Prevent the default form submission
		event.preventDefault();
	}

	function handleSelectChange(event, field) {
		selectedValues[field] = event.target.value;
		console.log(`${field}: ${selectedValues[field]}`);
	}
</script>

<main>
	<Navbar active={2} />

	<div>
		<form class="form" on:submit={handleSubmit}>
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

			<label for="income level">Income Bracket:</label>
			<select id="income" name="income" on:change={(event) => handleSelectChange(event, 'income')}>
				{#each monthlyIncomeCategory as category}
					<option value={category.factorWeight}>{category.factor}</option>
				{/each}
			</select>

			<label for="defaultCount">Default Count:</label>
			<input type="text" id="defaultCount" bind:value={defaultCount} readonly />
			<button on:click={increaseDefaultCount}>Increase</button>
			<button type="submit">Submit</button>
		</form>
	</div>
</main>

<style>
	main {
		display: flex;
		gap: 40px;
		font-family: 'Poppins';
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 40px;
	}
</style>
