<script>
	import Navbar from '../navbar/+page.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import supabase from '$lib/db.js'; // Assuming you have configured Supabase

	let schoolData = writable([]);
	let schoolsWithRequests = writable([]);
	let currentUserData = writable([]);
	let acceptedRequesters = writable([]);
	let approvedMessages = writable([]);
	let userData = {}; // Store the current user data
	let userRequests = []; // Store requests sent by the current user

	onMount(async () => {
		// Fetch all data from the schools table
		const { data: schoolResult, error: schoolError } = await supabase.from('schools').select('*');

		if (schoolError) {
			console.error('Error fetching school data:', schoolError.message);
			return;
		}

		schoolData.set(schoolResult);

		const { data: userResult, error: userError } = await supabase.auth.getUser();
		const { user } = userResult;
		if (userError) {
			console.error('Error fetching user data:', userError.message);
			return;
		}

		userData = userResult;

		let schools = [];
		schoolResult.forEach((school) => {
			if (school.requesters && Array.isArray(school.requesters)) {
				school.requesters.forEach((requester) => {
					if (requester.requester === user.id) {
						schools.push({
							message: requester.message,
							requester: requester.requester, // Assuming requester contains name
							time: new Date(requester.time).toLocaleString(), // Convert time to readable format
							receiver: requester.receiver // Store the school UUID for later reference
						});
					}
				});
			}
		});

		const currentUserSchoolData = schoolResult.filter((school) => {
			if (school.requesters && Array.isArray(school.requesters)) {
				return school.requesters.some((requester) => requester.receiver === user.id);
			}
			return false;
		});

		currentUserData.set(currentUserSchoolData);

		schoolsWithRequests.set(schools);
	});

	$: console.log($schoolsWithRequests);

	const getSchoolName = (uuid) => {
		const school = $schoolData.find((school) => school.schoolkey === uuid);
		return school ? school.schoolName : 'Unknown School';
	};

	const acceptRequest = async (requester) => {
		acceptedRequesters.update((acceptedRequests) => [...acceptedRequests, requester]);
		console.log('Accept request:', requester);

		await updatePermissions(requester);
		rejectRequest(requester);
	};

	const rejectRequest = (requester) => {
		const isAccepted = $acceptedRequesters.some(
			(accepted) => accepted.requester === requester.requester
		);

		if (isAccepted) {
			// Remove the requester from the schoolsWithRequests store
			schoolsWithRequests.update((schools) => {
				return schools.map((school) => {
					if (school.receiver === requester.receiver) {
						return {
							...school,
							requesters: school.requesters.filter((req) => req !== requester)
						};
					}
					return school;
				});
			});

			// Remove the requester from the currentUserData store
			currentUserData.update((schools) => {
				return schools.map((school) => {
					if (school.schoolkey === requester.receiver) {
						return {
							...school,
							requesters: school.requesters.filter((req) => req !== requester)
						};
					}
					return school;
				});
			});

			// Call the updateDatabase function to persist the changes in the database
			updateDatabase();
		}
	};

	const pureReject = async (requester) => {
		currentUserData.update((schools) => {
			return schools.map((school) => {
				if (school.schoolkey === requester.receiver) {
					return {
						...school,
						requesters: school.requesters.filter((req) => req !== requester)
					};
				}
				return school;
			});
		});

		// Call the updateDatabase function to persist the changes in the database
		updateDatabase();
	};

	const updateDatabase = async () => {
		try {
			const schools = $currentUserData;
			const promises = schools.map(async (school) => {
				const { data, error } = await supabase
					.from('schools')
					.update({ requesters: school.requesters })
					.eq('schoolkey', school.schoolkey);

				if (error) {
					console.error('Error updating school:', error);
				}
			});

			await Promise.all(promises);
			console.log('Database updated successfully');
		} catch (err) {
			console.error('Error updating database:', err);
		}
	};

	const updatePermissions = async (requester) => {
		const { data: userResult, error: userError } = await supabase.auth.getUser();
		const { user } = userResult;

		try {
			const { data: existingPermissions, error: fetchError } = await supabase
				.from('schools')
				.select('permission')
				.eq('schoolkey', requester.requester) // Use requester's UUID as the identifier
				.single();

			if (fetchError) {
				console.error('Error fetching existing permissions:', fetchError);
				return;
			}

			let permissions = [];
			if (existingPermissions && existingPermissions.permission) {
				permissions = [...existingPermissions.permission];
			}

			permissions.push({
				requester: requester.requester,
				message: requester.message,
				approvedAt: new Date().toISOString(),
				approvedby: user.id,
				toUpdate: requester.messageID // Current date and time when the request was approved
			});

			const { error: updateError } = await supabase
				.from('schools')
				.update({ permission: permissions })
				.eq('schoolkey', requester.requester); // Use requester's UUID as the identifier

			if (updateError) {
				console.error('Error updating permissions:', updateError);
				return;
			}

			console.log('Permissions updated successfully');
		} catch (err) {
			console.error('Error updating permissions:', err);
		}

		// Fetch approved messages for the current user
	};

	onMount(async () => {
		const { data: userResult, error: userError } = await supabase.auth.getUser();
		const { user } = userResult;
		try {
			const { data: approvedResult, error: approvedError } = await supabase
				.from('schools')
				.select('permission')
				.eq('schoolkey', user.id); // Filter by the current user's ID

			if (approvedError) {
				console.error('Error fetching approved messages:', approvedError.message);
				return;
			}
			console.log(approvedResult);
			const flattenedApprovedMessages = approvedResult.flatMap((school) => school.permission);

			approvedMessages.set(flattenedApprovedMessages);
		} catch (error) {
			console.error('Error fetching approved messages:', error.message);
		}
	});
</script>

<main>
	<Navbar active={5} />
	<div>
		<div>
			<h1>Pending Requests</h1>
			{#each $schoolsWithRequests as request}
				<div>
					<ul>
						<li>
							{request.message} <br />
							{request.time} <br />
							To: {getSchoolName(request.receiver)}
						</li>
					</ul>
				</div>
			{/each}
		</div>
		<div>
			<h2>Approved Requests</h2>
			{#if $approvedMessages.length === 0}
			  <p>No approvals yet.</p>
			{:else}
			  {#each $approvedMessages as message}
				<div>
				  <ul>
					<li>
					  <p>Message: {message.message}</p>
					  <p>Approved At: {new Date(message.approvedAt).toLocaleString()}</p>
					 
					</li>
				  </ul>
				</div>
			  {/each}
			{/if}
		  </div>
	</div>

	<div>
		<h1>Requests Received</h1>
		{#each $currentUserData as school}
			<div>
				<ul>
					{#each school.requesters as requester}
						<li>
							<p>Message: {requester.message}</p>
							<p>Time: {new Date(requester.time).toLocaleString()}</p>
							<p>From: {getSchoolName(requester.requester)}</p>
							<button on:click={() => acceptRequest(requester)}>Accept</button>
							<button on:click={() => pureReject(requester)}>Reject</button>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
	main {
		display: flex;
		gap: 40px;
		font-family: 'Poppins';
	}
</style>
