<script>
	import Navbar from '../navbar/+page.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import supabase from '$lib/db.js'; 

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
			if (school.student_transfer_request && Array.isArray(school.student_transfer_request)) {
				school.student_transfer_request.forEach((requester) => {
					if (requester.requester === user.id) {
						schools.push({
							message: requester.student_name,
							requester: requester.requester, // Assuming requester contains name
							time: new Date(requester.time).toLocaleString(), // Convert time to readable format
							receiver: requester.receiver // Store the school UUID for later reference
						});
					}
				});
			}
		});

		const currentUserSchoolData = schoolResult.filter((school) => {
			if (school.student_transfer_request && Array.isArray(school.student_transfer_request)) {
				return school.student_transfer_request.some((requester) => requester.receiver === user.id);
			    
            }
			return false;
		});

		currentUserData.set(currentUserSchoolData);
        console.log('The current user is', currentUserSchoolData);
		schoolsWithRequests.set(schools);
        console.log('The current schools with requests', schools);
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
    await updateStudentSchool(requester); 
    removeRequest(requester);
};



const removeRequest = async (requester) => {
    // Remove the requester from the schoolsWithRequests store
    schoolsWithRequests.update((schools) => {
        return schools.filter((school) => school.receiver !== requester.receiver);
    });

    // Remove the requester from the currentUserData store
    currentUserData.update((schools) => {
        return schools.map((school) => {
            if (school.schoolkey === requester.receiver) {
                return {
                    ...school,
                    student_transfer_request: school.student_transfer_request.filter((req) => req !== requester)
                };
            }
            return school;
        });
    });

    // Call the updateDatabase function to persist the changes in the database
    updateDatabase();
};

const pureReject = async (requester) => {
    currentUserData.update((schools) => {
        return schools.map((school) => {
            if (school.schoolkey === requester.receiver) {
                return {
                    ...school,
                    student_transfer_request: school.student_transfer_request.filter((req) => req !== requester)
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
					.update({ student_transfer_request: school.student_transfer_request })
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
    console.log('Who is the requester.request', requester.requester);
    try {
        const { data: existingPermissions, error: fetchError } = await supabase
            .from('schools')
            .select('student_permission')
            .eq('schoolkey', requester.requester) // Use requester's UUID as the identifier
            .single();

        if (fetchError) {
            console.error('Error fetching existing permissions:', fetchError);
            return;
        }

        let permissions = existingPermissions.student_permission || []; // Initialize with existing permissions or an empty array

        const newPermission = {
            requester: requester.requester,
            student_name: requester.student_name,
            student_id: requester.student_id,
            approvedAt: new Date().toISOString(),
            approvedby: user.id,
        };

        permissions.push(newPermission); // Append the new permission object to the existing array

        const { error: updateError } = await supabase
            .from('schools')
            .update({ student_permission: permissions })
            .eq('schoolkey', requester.requester); // Use requester's UUID as the identifier

        if (updateError) {
            console.error('Error updating permissions:', updateError);
            return;
        }

        console.log('Permissions updated successfully');
    } catch (err) {
        console.error('Error updating permissions:', err);
    }
};

	onMount(async () => {
		const { data: userResult, error: userError } = await supabase.auth.getUser();
		const { user } = userResult;
		try {
			const { data: approvedResult, error: approvedError } = await supabase
				.from('schools')
				.select('student_permission')
				.eq('schoolkey', user.id); // Filter by the current user's ID

			if (approvedError) {
				console.error('Error fetching approved messages:', approvedError.message);
				return;
			}
			console.log(approvedResult);
			const flattenedApprovedMessages = approvedResult.flatMap((school) => school.student_permission);

			approvedMessages.set(flattenedApprovedMessages);
		} catch (error) {
			console.error('Error fetching approved messages:', error.message);
		}
	});

    const updateStudentSchool = async (requester) => {
    try {
        const { data: existingData, error: fetchError } = await supabase
            .from('student')
            .select('default_count')
            .eq('studentkey', requester.student_id)
            .single();

        if (fetchError) {
            console.error('Error fetching existing student data:', fetchError);
            return;
        }

        const existingDefaultCount = existingData.default_count || [];
        const schoolExists = existingDefaultCount.some((obj) => obj.school === requester.requester);

        let updatedDefaultCount;
        if (schoolExists) {
            updatedDefaultCount = existingDefaultCount;
        } else {
            updatedDefaultCount = [...existingDefaultCount, { count: 0, school: requester.requester }];
        }

        const { error: updateError } = await supabase
            .from('student')
            .update({ studentSchool: requester.requester, default_count: updatedDefaultCount })
            .eq('studentkey', requester.student_id);

        if (updateError) {
            console.error('Error updating student school and default_count:', updateError);
        } else {
            console.log('Student school and default_count updated successfully');
        }
    } catch (err) {
        console.error('Error updating student school and default_count:', err);
    }
};
function formatDate(timestamp) {
        const date = new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${day}/${month}/${year}`;
	}

</script>

<main>
	<Navbar active={6} />
	<div>
		<div class="pending">
			<h2>Pending Transfer Requests</h2>
			{#if $schoolsWithRequests.length === 0}
			<p>No requests pending</p>
			{:else}
			<div class="scroll-pending">
			{#each $schoolsWithRequests as request}
				<div>
					<ul>
						<li>
							<p>Request for {request.message} </p>
							<p>Sent on: {formatDate(request.time)} </p>
							<p>To: {getSchoolName(request.receiver)}</p>
						</li>
					</ul>
				</div>
			{/each}
			
		</div>
		{/if}
		</div>
		<div class="approved">
			<h2>Transfers Approved</h2>
			{#if $approvedMessages.length === 0}
			  <p>No approvals yet.</p>
			{:else}
			  <div class="scroll-approved">
				{#if $approvedMessages.length > 0}
				  {#each $approvedMessages.slice().reverse() as message}
					{#if message}
					  <ul>
						<li>
						  <p>Name: {message.student_name || 'No message provided'}</p>
						  <p>ID: {message.student_id}</p>
                          <p>Approved By: {getSchoolName(message.approvedby, 'schoolkey')}</p>
                          <p>Approved On: {formatDate(message.approvedAt)}</p>
						</li>
					  </ul>
					{/if}
				  {/each}
				{/if}
			  </div>
			{/if}
		  </div>
	</div>

	<div class="received">
		<h2>Transfer Requests Received</h2>
		{#if $currentUserData.length === 0}
				<p>You have no requests from other schools.</p>
			{:else}
		<div class="request-scroll"> 
		{#each $currentUserData as school}
			<div>
				<ul>
					{#each school.student_transfer_request as requester}
						<li>
                            <p>Student ID: {requester.student_id}</p>
							<p>Student Name: {requester.student_name}</p>
							<p>Time: {formatDate(requester.time)}</p>
							<p>From: {getSchoolName(requester.requester)}</p>
							<button class="accept-button" on:click={() => acceptRequest(requester)}>Accept</button>
							<button class="reject-button" on:click={() => pureReject(requester)}>Reject</button>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
	{/if}
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
		font-family: 'Roboto';
	}

	h2 {
		color: rgb(110, 110, 110);
		text-align: left;

	}
	li{
		text-align: left;
	}
	.pending {
		border: 1px solid grey;
		position: absolute;
		padding: 20px;
		margin-top: 10px;
		width: 600px;
		max-height: 270px;
		height: 270px;
	}
	.approved{
		border: 1px solid grey;
		position: absolute;
		bottom: 20px;
		width: 600px;
		padding: 20px;
		max-height: 400px;
        height: 300px;
	}
	.received{
		border: 1px solid grey;
		position: absolute;
		right: 120px;
		padding: 20px;
		width: 440px;
		height: 620px;
		max-height: 620px;
		margin-top: 10px;
	}
	.scroll-pending{
		max-height: 200px;
		overflow-y: scroll;
	}
	.scroll-approved{
		max-height: 200px;
		overflow-y: scroll;
	}
	.request-scroll{
		max-height: 550px;
		overflow-y: scroll;
	}
	.scroll-pending::-webkit-scrollbar {
    width: 6px; /* Width of the scrollbar */
    height: 6px; /* Height of the scrollbar (if vertical) */
}
button{
	border: none;
	font-size: 14px;
	margin: 12px;
	color: black;
	cursor: pointer;
}
.accept-button{
   border: 1px solid green;
   background-color: rgba(180, 217, 180, 0.711);
   transition: background-color 0.2s ease-in-out;
}
.reject-button{
	border: 1px solid red;
   background-color: rgba(217, 180, 180, 0.711);
   transition: background-color 0.2s ease-in-out;
}
.accept-button:hover{
	background-color: rgb(3, 43, 3);
	color: white;
}

.reject-button:hover{
	background-color: rgb(35, 4, 4);
	color: white;

}

/* Thin scrollbar thumb */
.scroll-pending::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.5); /* Color of the scrollbar thumb */
    border-radius: 3px; /* Rounded corners */
}

/* Hover effect for scrollbar thumb */
.scroll-pending::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.7); /* Color of the scrollbar thumb on hover */
}
.scroll-approved::-webkit-scrollbar {
    width: 6px; /* Width of the scrollbar */
    height: 6px; /* Height of the scrollbar (if vertical) */
}

/* Thin scrollbar thumb */
.scroll-approved::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.5); /* Color of the scrollbar thumb */
    border-radius: 3px; /* Rounded corners */
}

/* Hover effect for scrollbar thumb */
.scroll-approved::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.7); /* Color of the scrollbar thumb on hover */
}
.request-scroll::-webkit-scrollbar {
    width: 6px; /* Width of the scrollbar */
    height: 6px; /* Height of the scrollbar (if vertical) */
}

/* Thin scrollbar thumb */
.request-scroll::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.5); /* Color of the scrollbar thumb */
    border-radius: 3px; /* Rounded corners */
}

/* Hover effect for scrollbar thumb */
.request-scroll::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.7);
	width: 16px; /* Color of the scrollbar thumb on hover */
}

@media only screen and (max-width: 768px) {
    main {
        flex-direction: column;
        overflow-y: auto;
        max-height: calc(100vh - 60px); /* Adjust the value based on your navbar height */
    }

    

    .pending,
    .approved,
    .received {
        position: static;
		margin-left: 15px;
        width: 80%;
        max-height: none;
        height: auto;
        margin-bottom: 100px;

    }

    .request-scroll {
        max-height: 300px; /* Adjust the height as needed */
    }
}

</style>
