<script>
	// Import necessary components and libraries
	import Navbar from '../navbar/+page.svelte'; // Import Navbar component
	import supabase from '$lib/db.js'; // Supabase client for database operations
	import { onMount } from 'svelte'; // Lifecycle hook for component mounting
	import { writable } from 'svelte/store'; // Svelte store for reactive variables
	import { goto } from '$app/navigation'; // Function for navigation
	import search from '$lib/search.svg'; // SVG asset for search icon
	import loader from '$lib/dots.gif'; // GIF asset for loading animation


	// Reactive variables to store data and states
	const schoolData = writable([]); // Store for school data
	const studentData = writable([]); // Store for student data
	let dataLoaded = false; // State to check if data is loaded
	let accumulatedCount = 0; // Variable to accumulate counts
	const filteredStudents = writable([]); // Store for filtered student data

	// Function to navigate to student details page
	function navigatetostudent(id) {
		goto(`/studentDetails/${id}`);
	}

	// Async function to fetch student data from the database
	async function fetchStudentData() {
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
			} else {
				studentData.set(allStudents);
				console.log('Every single student', allStudents);
			}
		} catch (error) {
			console.error(error.message);
		}
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

	// Lifecycle hook to execute code when the component is mounted
	onMount(async () => {
		await fetchStudentData();
		await fetchSchoolData();
		await filterStudents('');

		// Calculate accumulated count after all data is fetched
		$studentData.forEach((student) => {
			student.default_count.forEach(({ count }) => {
				accumulatedCount += count;
			});
		});

		dataLoaded = true;
	});
    
	// Function to get CSS class based on credit score
	function getScoreClass(creditScore) {
		if (creditScore >= 300 && creditScore <= 579) {
			return 'poor';
		} else if (creditScore >= 580 && creditScore <= 669) {
			return 'fair';
		} else if (creditScore >= 670 && creditScore <= 739) {
			return 'good';
		} else if (creditScore >= 740 && creditScore <= 799) {
			return 'very-good';
		} else if (creditScore >= 800 && creditScore <= 850) {
			return 'excellent';
		} else {
			// Return a default class if score doesn't fall into any range
			return '';
		}
	}

    // Async function to filter students based on a search query
	async function filterStudents(query) {
		if (!query.trim()) {
			// If the query is empty or contains only whitespace, show all students
			filteredStudents.set($studentData);
		} else {
			// Filter students based on the search query
			const filteredStudentsArray = $studentData.filter((student) => {
				const schoolName = $schoolData.find(
					(school) => school.schoolkey === student.studentSchool
				)?.schoolName;

				return (
					student.studentName.toLowerCase().includes(query.toLowerCase()) ||
					(schoolName && schoolName.toLowerCase().includes(query.toLowerCase()))
				);
			});
			filteredStudents.set(filteredStudentsArray);
		}
	}
	function getTooltipText(creditScore) {
		if (creditScore >= 300 && creditScore <= 579) {
			return 'Remark: Poor\nThis credit score indicates a high risk of defaulting on school fees payment.';
		} else if (creditScore >= 580 && creditScore <= 669) {
			return 'Remark: Fair\nThis credit score suggests an increased risk of defaulting on school fees payment.';
		} else if (creditScore >= 670 && creditScore <= 739) {
			return 'Remark: Good\nThis credit score is considered acceptable for school fees payment, but there may still be some risk.';
		} else if (creditScore >= 740 && creditScore <= 799) {
			return 'Remark: Very Good\nThis credit score is associated with a lower risk of defaulting on school fees payment.';
		} else if (creditScore >= 800 && creditScore <= 850) {
			return 'Remark: Excellent\nThis credit score indicates the least risk of defaulting on school fees payment.';
		} else {
			return '';
		}
	}

	let activeFilter = 'all'; // Track the active filter

	function filterByScore(score) {
		activeFilter = score;
		let filteredStudentsArray = [];

		if (score === 'all') {
			filteredStudentsArray = $studentData;
		} else {
			filteredStudentsArray = $studentData.filter((student) => {
				const creditScore = student.credit_score;
				if (score === 'poor') {
					return creditScore >= 300 && creditScore <= 579;
				} else if (score === 'fair') {
					return creditScore >= 580 && creditScore <= 669;
				} else if (score === 'good') {
					return creditScore >= 670 && creditScore <= 739;
				} else if (score === 'very-good') {
					return creditScore >= 740 && creditScore <= 799;
				} else if (score === 'excellent') {
					return creditScore >= 800 && creditScore <= 850;
				}
			});
		}

		filteredStudents.set(filteredStudentsArray);
	}
</script>

<main>
	<div>
		<Navbar active={1} />
	</div>

	{#if !dataLoaded}
		<div class="loading">
			<img src={loader} alt="loading" />
		</div>
	{:else}
		<div class="dash">
			<div class="all-students">
				<h2>Green<span>Light</span></h2>

				<div class="search-container">
					<div>
						<input
							type="text"
							placeholder="Search for students or schools"
							on:input={(e) => filterStudents(e.target.value)}
						/>
						<img src={search} alt="search-icon" />
					</div>

					<div class="filter-buttons">
						<button class:active={activeFilter === 'all'} on:click={() => filterByScore('all')}
							>All</button
						>
						<button
							class:active={activeFilter === 'poor'}
							on:click={() => filterByScore('poor')}
							class="poor">Poor: 300-579</button
						>
						<button
							class:active={activeFilter === 'fair'}
							on:click={() => filterByScore('fair')}
							class="fair">Fair: 580-669</button
						>
						<button
							class:active={activeFilter === 'good'}
							on:click={() => filterByScore('good')}
							class="good">Good: 670-739</button
						>
						<button
							class:active={activeFilter === 'very-good'}
							on:click={() => filterByScore('very-good')}
							class="very-good">Very Good: 740-799</button
						>
						<button
							class:active={activeFilter === 'excellent'}
							on:click={() => filterByScore('excellent')}
							class="excellent">Excellent: 800-850</button
						>
					</div>
				</div>
			</div>
			<div class="request-scroll">
				{#each $filteredStudents.reverse() as student}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<!-- Inside the each block for student cards -->
					<div
						class="student-card {getScoreClass(student.credit_score)}"
						on:click={() => navigatetostudent(student.studentkey)}
						title={getTooltipText(student.credit_score)}
					>
						<div class="name-score">
							<div><h3>{student.studentName}</h3></div>
							<div class="score-remark">
								{#if student.credit_score >= 300 && student.credit_score <= 579}
									<h4 class="poor">{student.credit_score}</h4>
									<p class="poor">Poor Credit</p>
								{:else if student.credit_score >= 580 && student.credit_score <= 669}
									<h4 class="fair">{student.credit_score}</h4>
									<p class="fair">Fair Credit</p>
								{:else if student.credit_score >= 670 && student.credit_score <= 739}
									<h4 class="good">{student.credit_score}</h4>
									<p class="good">Good Credit</p>
								{:else if student.credit_score >= 740 && student.credit_score <= 799}
									<h4 class="very-good">{student.credit_score}</h4>
									<p class="very-good">Very Good Credit</p>
								{:else if student.credit_score >= 800 && student.credit_score <= 850}
									<h4 class="excellent">{student.credit_score}</h4>
									<p class="excellent">Excellent Credit</p>
								{/if}
							</div>
						</div>

						<div class="school-pay">
							{#if $schoolData.find((school) => school.schoolkey === student.studentSchool)}
								<p>
									{$schoolData.find((school) => school.schoolkey === student.studentSchool)
										?.schoolName}
								</p>
							{:else}
								<p>School Name: Not found</p>
							{/if}
							<p>
								Payments Due:
								{#if student.default_count}
									{student.default_count.reduce((accumulator, { count }) => accumulator + count, 0)}
								{:else}
									0
								{/if}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</main>

<style>
	.filter-buttons {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}

	.filter-buttons button {
		padding: 4px 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #f5f5f5;
		cursor: pointer;
	}

	.filter-buttons button.active {
		color: #ffffff;
		background-color: #777;
		border: 1px solid black;
	}

	.filter-buttons button.poor {
		border-color: rgb(130, 1, 1); /* Red */
	}

	.filter-buttons button.poor.active {
		background-color: rgb(130, 1, 1); /* Red */
	}

	.filter-buttons button.fair {
		border-color: #ffc107; /* Orange */
	}

	.filter-buttons button.fair.active {
		background-color: #ffc107; /* Orange */
	}

	.filter-buttons button.good {
		border-color: #ff9800; /* Yellow */
	}

	.filter-buttons button.good.active {
		background-color: #ff9800; /* Yellow */
	}

	.filter-buttons button.very-good {
		border-color: #8bc34a; /* Light Green */
	}

	.filter-buttons button.very-good.active {
		background-color: #8bc34a; /* Light Green */
	}

	.filter-buttons button.excellent {
		border-color: #4caf50; /* Deep Green */
	}

	.filter-buttons button.excellent.active {
		background-color: #4caf50; /* Deep Green */
	}
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		width: 100%; /* Set height to full viewport height */
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

	main {
		display: flex;
		gap: 10px;
		font-family: 'Roboto';
	}
	.title-and-logo {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		margin-top: -10px;
	}
	.search-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	.search-container img {
		position: absolute;
		left: 450px;
		top: 44px;
	}

	.all-students {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 20px;
		background-color: rgb(255, 255, 255); /* Set background color to white */
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Add box shadow */
		padding-bottom: 10px;
	}

	.all-students h2 {
		color: rgb(57, 122, 14);
		font-size: 39px;

		border-radius: 10px;
		padding: 10px;
		margin-bottom: -3px;
	}
	.all-students span {
		color: black;
	}
	.all-students p {
		color: grey;
	}
	.all-students input {
		height: 20px;
		border-radius: 10px;
		border: 1px solid grey;
		padding: 10px;
		padding-left: 39px;
		width: 800px;
		margin-top: 34px;
	}
	.dash {
		display: flex;
		flex-direction: column;
	}

	.student-card {
		border: 1px solid #ddd;
		border-radius: 8px;
		width: 270px;
		height: 150px;
		max-height: 180px;
		overflow-y: hidden;
		overflow-x: hidden;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 20px;
		background-color: #fff;
		transition: box-shadow 0.3s ease;
		margin-bottom: 10px;
		margin-left: 10px;
	}

	.student-card:hover {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.name-score {
		display: flex;
		gap: 20px;
		margin-left: 10px;
		align-items: center;
		justify-content: space-between;
	}

	.name-score h3 {
		font-size: 20px;
		font-weight: 500;
		color: #333;
	}

	.score-remark {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.score-remark h4 {
		font-size: 39px;
		margin: 0;
	}

	.score-remark p {
		font-size: 13px;
		color: #777;
	}

	.school-pay {
		margin-left: 10px;
	}

	.school-pay p {
		font-size: 14px;
		color: #555;
		margin: 4px 0;
	}

	.score-remark h4.poor {
		color: rgb(130, 1, 1);
	}

	.score-remark h4.fair {
		color: #ffc107;
	}

	.score-remark h4.good {
		color: #ff9800;
	}

	.score-remark h4.very-good {
		color: #8bc34a;
	}

	.score-remark h4.excellent {
		color: #4caf50;
	}

	.score-remark p {
		font-size: 13px;
		color: #777;
	}

	/* Remark text styles */

	.school-pay {
		margin-left: 10px;
	}

	.school-pay p {
		font-size: 14px;
		color: #555;
		margin: 4px 0;
	}

	.request-scroll::-webkit-scrollbar {
		width: 12px;
		height: 16px;
	}

	.request-scroll::-webkit-scrollbar-thumb {
		background-color: rgb(1, 66, 22);
		border-radius: 3px;
	}

	.request-scroll::-webkit-scrollbar-thumb:hover {
		background-color: rgba(4, 120, 0, 0.566);
		width: 16px;
	}
	.request-scroll {
		display: grid;
		margin-top: 10px;
		grid-template-columns: repeat(4, 1fr);
		width: 100%;
		height: 520px;
		overflow-y: auto;
		overflow-x: hidden;
	}
	.request-scroll::-webkit-scrollbar {
		width: 8px; /* Width of the scrollbar */
		height: 8px; /* Height of the scrollbar (if vertical) */
		margin-left: 2px;
	}

	/* Thin scrollbar thumb */
	.request-scroll::-webkit-scrollbar-thumb {
		background-color: rgb(197, 188, 24); /* Color of the scrollbar thumb */
		border-radius: 3px; /* Rounded corners */
		margin-left: 2px;
	}

	/* Hover effect for scrollbar thumb */
	.request-scroll::-webkit-scrollbar-thumb:hover {
		background-color: rgba(4, 120, 0, 0.566);
		width: 10px; /* Color of the scrollbar thumb on hover */
	}
	.student-card:hover {
		border-color: rgba(0, 0, 0, 0.2); /* Default border color on hover */
	}

	.student-card.poor:hover {
		border-color: rgba(179, 0, 0, 0.692); /* Red border color on hover for poor credit score */
	}

	.student-card.fair:hover {
		border-color: rgba(255, 193, 7, 0.5); /* Yellow border color on hover for fair credit score */
	}

	.student-card.good:hover {
		border-color: rgba(255, 152, 0, 0.5); /* Orange border color on hover for good credit score */
	}

	.student-card.very-good:hover {
		border-color: rgba(
			139,
			195,
			74,
			0.5
		); /* Light green border color on hover for very good credit score */
	}

	.student-card.excellent:hover {
		border-color: rgba(
			76,
			175,
			80,
			0.5
		); /* Green border color on hover for excellent credit score */
	}

	@media only screen and (max-width: 768px) {
		.filter-buttons {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 8px;
			margin-top: 8px;
			margin-left: 40px;
		}

		.request-scroll {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			margin-top: 10px;
			width: 100%;
			height: 100%;
			margin-bottom: 100px;
		}
		.title-and-logo {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			margin-top: -10px;
		}

		.search-container img {
			display: none;
		}

		.all-students {
			display: flex;
			flex-direction: column;
			justify-content: center;
			gap: 20px;
			background-color: rgb(255, 255, 255); /* Set background color to white */
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Add box shadow */
			padding-bottom: 10px;
		}

		.all-students h2 {
			color: rgb(57, 122, 14);
			font-size: 39px;
			border-radius: 10px;
			padding: 10px;
		}
		.all-students input {
			height: 20px;
			border-radius: 10px;
			border: 1px solid grey;
			padding: 10px;
			padding-left: 39px;
			width: 90%;
			margin-top: -10px;
		}
		.dash {
			display: flex;
			flex-direction: column;
			justify-content: center;

			width: 90%;
			overflow-x: hidden;
		}
		.search-container input {
			padding: 10px;
			width: 100%;
		}
		.search-container {
			margin-right: 19px;
		}
	}
</style>
