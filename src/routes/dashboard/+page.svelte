<script>
	import Navbar from '../navbar/+page.svelte';
	import supabase from '$lib/db.js';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { goto } from '$app/navigation';

	const schoolData = writable([]);
	const studentData = writable([]);
	let dataLoaded = false;
	let accumulatedCount = 0;
	const filteredStudents = writable([]);

	
	function navigatetostudent(id) {
		goto(`/studentDetails/${id}`);
	}

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
         
		// Get the user object
	});

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

	
	async function filterStudents(query) {
  if (!query.trim()) {
    // If the query is empty or contains only whitespace, show all students
    filteredStudents.set($studentData);
  } else {
    // Filter students based on the search query
    const filteredStudentsArray = $studentData.filter(student =>
      student.studentName.toLowerCase().includes(query.toLowerCase())
    );
    filteredStudents.set(filteredStudentsArray);
  }
}
function getTooltipText(creditScore) {
    if (creditScore >= 300 && creditScore <= 579) {
        return 'Credit Score: Poor\nThis credit score range indicates a high risk of defaulting on school fees payment.';
    } else if (creditScore >= 580 && creditScore <= 669) {
        return 'Credit Score: Fair\nThis credit score range suggests an increased risk of defaulting on school fees payment.';
    } else if (creditScore >= 670 && creditScore <= 739) {
        return 'Credit Score: Good\nThis credit score range is considered acceptable for school fees payment, but there may still be some risk.';
    } else if (creditScore >= 740 && creditScore <= 799) {
        return 'Credit Score: Very Good\nThis credit score range is associated with a lower risk of defaulting on school fees payment.';
    } else if (creditScore >= 800 && creditScore <= 850) {
        return 'Credit Score: Excellent\nThis credit score range indicates the least risk of defaulting on school fees payment.';
    } else {
        return ''; // Return empty string if score doesn't fall into any range
    }
}


 
</script>

<main>
	<div>
		<Navbar active={1} />
	</div>
	
	{#if !dataLoaded}
		<h2>Please wait...</h2>
	{:else}
	<div class="dash">
		<div class="all-students">
			<h2>Green<span>Light</span></h2>
			<p>Your Default Count Tracker Across Basic Private Schools In Ghana</p>
			<input type="text" placeholder="Search Student" on:input="{e => filterStudents(e.target.value)}"/>
			
		</div>
		<div class="request-scroll">
			{#each $filteredStudents as student}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<!-- Inside the each block for student cards -->
				<div
    class="student-card {getScoreClass(student.credit_score)}"
    on:click={() => navigatetostudent(student.studentkey)}
    title="{getTooltipText(student.credit_score)}"
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
	:global(body) {
		margin: 0;
		padding: 0;
	}

	main {
		display: flex;
		gap: 10px;
		font-family: 'Roboto';
	}
   .all-students{
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;;
   }
   .all-students h2{
	color: rgb(57, 122, 14);
	font-size: 39px;
	border: 1px solid black;
	border-radius: 10px;
	padding: 10px;
	margin-bottom: -3px;
   }
   .all-students span{
	color: black;
   }
   .all-students p{
	color: grey;
   }
  .all-students input{
	height: 20px;
	border-radius:10px;
	border: 1px solid grey;
	padding: 10px;
	width: 500px;
	margin-top: 20px;
  }
	.dash {
    display: flex;
	flex-direction:column ;
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
		margin-top: 40px;
		grid-template-columns: repeat(4, 1fr);
		width: 100%;
		height: 400px;
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
</style>
