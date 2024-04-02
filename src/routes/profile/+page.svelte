<script>
	import Navbar from '../navbar/+page.svelte';
	import supabase from '$lib/db.js';
	import { onMount } from 'svelte';

	let schoolName = '';
	let location = '';
	let website = '';
	let phone = '';
	let schoolEmail = '';
	let newPassword = '';

	let showToast = false;
	let toastType = ''; // 'success' or 'failure'
	let toastMessage = '';

	onMount(async () => {
		const { data: userResult, error: userError } = await supabase.auth.getUser();
		const { user } = userResult;

		const { data: theSchoolData, error: fetchError } = await supabase
			.from('schools')
			.select('*')
			.eq('schoolkey', user.id)
			.single();

		if (theSchoolData) {
			schoolName = theSchoolData.schoolName || '';
			location = theSchoolData.location || '';
			website = theSchoolData.website || '';
			phone = theSchoolData.phone || '';
			schoolEmail = user.email; // Set the initial value of schoolEmail to the current user's email
		}
	});

	async function saveChanges() {
		// Update the school record in the database
		const { data: userResult, error: userError } = await supabase.auth.getUser();
		const { user } = userResult;

		const { error: updateError } = await supabase
			.from('schools')
			.update({
				schoolName,
				location,
				website,
				phone,
				school_email: schoolEmail
			})
			.eq('schoolkey', user.id);

		if (!updateError) {
			// Update the user's email and password
			const { error: updateUserError } = await supabase.auth.updateUser({
				email: schoolEmail, // Use schoolEmail to update the user's email
				password: newPassword || null // Set the new password if provided, or null to keep the current password
			});

			if (!updateUserError) {
				showToast = true;
				toastType = 'success';
				toastMessage = 'Changes saved successfully!';
				setTimeout(() => {
					showToast = false; // Hide toast after a certain time
				}, 3000);
			} else {
				showToast = true;
				toastType = 'failure';
				toastMessage = 'Error updating user: ' + updateUserError.message;
			}
		} else {
			showToast = true;
			toastType = 'failure';
			toastMessage = 'Error updating school: ' + updateError.message;
		}
	}
</script>

<main>
	<Navbar active={3} />
	<div class="form-container">
		<h1>Settings</h1>
		<form on:submit|preventDefault={saveChanges}>
			<label>
				School Name:
				<input type="text" bind:value={schoolName} />
			</label>
			<label>
				Location:
				<input type="text" bind:value={location} />
			</label>
			<label>
				Website:
				<input type="text" bind:value={website} />
			</label>
			<label>
				Phone:
				<input type="text" bind:value={phone} />
			</label>
			<label>
				Email:
				<input type="email" bind:value={schoolEmail} />
			</label>
			<label>
				New Password:
				<input type="password" bind:value={newPassword} />
			</label>
			<button type="submit">Save Changes</button>
		</form>
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

	main {
		display: flex;
		gap: 40px;
		font-family: 'Roboto';
	}

	.form-container {
		border-radius: 5px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 15px;
		width: 80%; /* Make the form container full width on larger screens */
	}

	label {
		display: flex;
		align-items: center;
		margin-bottom: 5px;
		font-weight: bold;
	}

	input[type='text'],
	input[type='email'],
	input[type='password'] {
		padding: 10px;
		margin: 20px;
		border: 1px solid #ccc;
		border-radius: 3px;
    width: 70%;
		/* Make inputs flexible to fill available space */
	}

	button {
		border: none;
		font-size: 18px;
		width: 200px;
		position: relative;
		margin-top: 40px;
		cursor: pointer;
	}

	button:hover {
		color: white;
		background-color: black;
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
		background-color: rgb(133, 0, 0);
		opacity: 1;
		color: white !important;
	}

	.toast.failure p {
		color: white;
	}

	@media (max-width: 768px) {
		main {
			flex-direction: column; /* Stack elements on smaller screens */
			gap: 20px;
		}

		.form-container {
			width: 30%; /* Ensure form container remains full width on small screens */
		}

		input[type='text'],
		input[type='email'],
		input[type='password'] {
			padding: 10px;
			margin: 14px;
			border: 1px solid #ccc;
			border-radius: 3px;
      width: 240px;
			/* Make inputs flexible to fill available space */
		}

		button {
			border: none;
			font-size: 18px;
			width: 200px;
			position: relative;
			left: 50%;
			margin-top: 40px;
		}
	}
</style>
