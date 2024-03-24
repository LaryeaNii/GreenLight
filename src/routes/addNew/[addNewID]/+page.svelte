<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Navbar from '../../navbar/+page.svelte';
	import supabase from '$lib/db.js';

	let addNewID; // Variable to store the addNewID parameter from the route
	let parentDetails; // Variable to store the fetched parent details
	let isLoading = false; // Flag to track loading state

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
    education:1 ,
    income: 1
};

let realValues = {
    maritalStatus: "Unknown",
    numDependents: "Unknown",
    education: "Unknown",
    income: "Unknown"
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

	// Function to fetch parent details based on the addNewID
	async function fetchParentDetails() {
		isLoading = true; // Set loading flag to true

		const { data, error } = await supabase.from('parent').select('*').eq('parent_key', addNewID);
		

		if (error) {
			console.error('Error fetching parent details:', error.message);
			return;
		}

		parentDetails = data[0]; // Store the fetched parent details
		console.log(parentDetails.marital_status)
		isLoading = false; // Set loading flag to false

		selectedValues = {
    maritalStatus: maritalCategory.find(c => c.factor === parentDetails.marital_status)?.factorWeight || 1,
    numDependents: numberofDependentsCategory.find(c => c.factor === parentDetails.numberofDependents)?.factorWeight || 1,
    education: highestEducationCategory.find(c => c.factor === parentDetails.highest_education)?.factorWeight || 1,
    income: monthlyIncomeCategory.find(c => c.factor === parentDetails.income)?.factorWeight || 1
};


realValues = {
    maritalStatus: parentDetails.marital_status,
    numDependents: parentDetails.numberofDependents,
    education: parentDetails.highest_education,
    income: parentDetails.income};

	}

	


	onMount(async () => {
		addNewID = $page.params.addNewID; // Get the addNewID from the route parameters using page store
		await fetchParentDetails(); // Fetch parent details when component mounts
	});
</script>

<main>
    <Navbar active={2} />
    {#if isLoading}
        <p>Loading...</p>
    {:else if parentDetails}
        <div class="categories">
            <h1>{parentDetails.parentName}</h1>
            <label for="maritalStatus">Marital Status:</label>
			<select id="maritalStatus" bind:value={selectedValues.maritalStatus}>
				{#each maritalCategory as category}
					<option value={category.factorWeight} selected={category.factor === realValues.maritalStatus}>
						{category.factor}
					</option>
				{/each}
			</select>

            <label for="numDependents">Number of Dependents:</label>
            <select id="numDependents" bind:value={selectedValues.numDependents}>
				{#each numberofDependentsCategory as category}
					<option value={category.factorWeight} selected={category.factor === realValues.numDependents}>
						{category.factor}
					</option>
				{/each}
			</select>



            <label for="education">Highest Education:</label>
            <select id="education" bind:value={selectedValues.education}>
				{#each highestEducationCategory as category}
					<option value={category.factorWeight} selected={category.factor === realValues.education}>
						{category.factor}
					</option>
				{/each}
			</select>



            <label for="income">Income:</label>
            <select id="income" bind:value={selectedValues.income}>
				{#each monthlyIncomeCategory as category}
					<option value={category.factorWeight} selected={category.factor === realValues.income}>
						{category.factor}
					</option>
				{/each}
			</select>
        </div>
    {:else}
        <p>No parent details found.</p>
    {/if}
</main>


<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
	main {
		display: flex;
		font-family: 'Poppins', sans-serif;
		gap: 40px;
	}
	.categories{
		display: flex;
		flex-direction: column;
	}
</style>
