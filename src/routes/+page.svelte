<script>
	// Import modules like supabase for database support. 
	import supabase from '$lib/db.js';
	import { onDestroy, onMount } from 'svelte';
	import connect from '$lib/connect-svgrepo-com.svg';
	import score from '$lib/scoreboard-svgrepo-com.svg';
	import shield from '$lib/shield-user-svgrepo-com.svg';
	import NewProfile from '../routes/newprofile/+page.svelte';//imported component from NewProfile
	import { goto } from '$app/navigation';
	import showpassword from "$lib/showpassword.svg";

	// Reactive variables for user interactions and states
	let clickedLogin = true; // State to check if login button is clicked
	let clickedSignUp = false; // State to check if signup button is clicked
	let showNewProfile = false; // State to show new profile component


	let userEmail = ''; // User email input
	let userPassword = ''; // User password input
	let showPassword = false; // State to show/hide password

	let showToast = false; // State to show/hide toast notifications
	let toastType = ''; // Type of toast ('success' or 'failure')
	let toastMessage = ''; // Message for toast notification

	// Carousel slider states and settings
	let currentSlide = 0;
	const slides = [
		{
			svg: connect,
			subtitle:
				'Join the fastest growing network of schools in collaborating and sharing information to protect our financial interests',
			borderColor: '#8B0000',
			gradientColor: 'linear-gradient(to bottom right, #8B0000, #8B0000)',
			buttonColor: '#8B0000'
		},
		{
			svg: score,
			subtitle:
				'Monitor credit scores and default counts of parents to ensure financial stability within the school community',
			borderColor: '#ffc107',
			gradientColor: 'linear-gradient(to bottom right, #ffc107, #ffa000)',
			buttonColor: '#ffc107'
		},
		{
			svg: shield,
			subtitle:
				'Protect your institution against financial defaults with comprehensive credit monitoring and risk assessment',
			borderColor: '#28a745',
			gradientColor: 'linear-gradient(to bottom right, #28a745, #1e7e34)',
			buttonColor: '#28a745'
		}
	];
	let intervalId; // Interval ID for carousel slider

	// Lifecycle function to start the carousel slider
	onMount(() => {
		intervalId = setInterval(() => {
			currentSlide = (currentSlide + 1) % slides.length;
		}, 9000);
	});
    
	// Cleanup interval on component destroy
	onDestroy(() => clearInterval(intervalId));

	// Function to handle user login
	const login = async () => {
		if (!validatePassword(userPassword)) {
			passwordError = 'Incorrect Password.';
			return;
		} else {
			passwordError = '';
		}

		let { data, error } = await supabase.auth.signInWithPassword({
			email: userEmail,
			password: userPassword
		});

		if (!error) {
			goto('/dashboard');
		}

		if (error) {
			showToast = true;
			toastType = 'failure';
			toastMessage = 'Either your password is incorrect or there is a network issue.';
		}
	};

	// Function to handle user signup
	const signUp = async () => {
		if (!validatePassword(userPassword)) {
			passwordError = 'Password must include numbers and letters.';
			return;
		} else {
			passwordError = '';
		}

		let { data, error } = await supabase.auth.signUp({
			email: userEmail,
			password: userPassword
		});

		if (!error) {
			showNewProfile = true;
		}
	};

	// Functions to toggle between login and signup
	function fakelogin() {
		clickedLogin = true;
		clickedSignUp = false;
	}

	function fakeSignUp() {
		clickedLogin = false;
		clickedSignUp = true;
	}
	let passwordError = ''; // New variable to store password error message

	const validatePassword = (password) => {
		const regex = /^(?=.*[a-zA-Z])(?=.*\d).+$/; // Regex to check if password contains letters and numbers
		return regex.test(password);
	};

	// Function to handle forgot password
	async function handleForgotPassword() {
		const { error } = await supabase.auth.resetPasswordForEmail(userEmail);

		if (error) {
			showToast = true;
			toastType = 'failure';
			toastMessage = 'There was an error resetting your password. Please try again.';
		} else {
			showToast = true;
			toastType = 'success';
			toastMessage = 'A password reset email has been sent to your address.';
		}
	}

	let showForgotPasswordButton = false; // State to show/hide forgot password button

  	// Function to handle email input change
	function handleEmailChange() {
		showForgotPasswordButton = userEmail.trim().length > 0;
	}

	function toggleShowPassword(){
		showPassword = !showPassword
	}

</script>

<main>
	<div
		class="big-container"
		style="border-color: {slides[currentSlide].borderColor}; box-shadow: 0 10px 20px {slides[
			currentSlide
		].borderColor};"
	>
		{#if showNewProfile}
			<NewProfile />
		{:else}
			<div class="left-gradient" style="background: {slides[currentSlide].gradientColor};">
				<div class="solo"><h2>GreenLight</h2></div>
				<div class="icon-container">
					<div class="slide-content" class:visible={currentSlide === 0}>
						<img src={slides[0].svg} alt="Current Icon" class="icon" />
						<p>{slides[0].subtitle}</p>
					</div>
					<div class="slide-content" class:visible={currentSlide === 1}>
						<img src={slides[1].svg} alt="Current Icon" class="icon" />
						<p>{slides[1].subtitle}</p>
					</div>
					<div class="slide-content" class:visible={currentSlide === 2}>
						<img src={slides[2].svg} alt="Current Icon" class="icon" />
						<p>{slides[2].subtitle}</p>
					</div>
				</div>
			</div>
			<div class="right-content">
				{#if !clickedLogin && clickedSignUp}
					<h2>Create An Account</h2>
				{/if}
				{#if clickedLogin && !clickedSignUp}
					<h2>Welcome Back!</h2>
				{/if}
				<form class="login-form">
					<input
						type="email"
						placeholder="School Email"
						bind:value={userEmail}
						on:input={handleEmailChange}
					/>
		
					
					<div class="password-container">
						{#if showPassword}
							<input type="text" placeholder="Password" bind:value={userPassword} />
						{:else}
							<input type="password" placeholder="Password" bind:value={userPassword} />
						{/if}
						<div class="showpass">
							<button on:click={toggleShowPassword}><img src={showpassword} alt="showpassword"></button>
						</div>
					</div>
					{#if clickedSignUp && !clickedLogin}
						<button
							class="join-button"
							style="background-color: {slides[currentSlide].buttonColor};"
							on:click={signUp}>Join</button
						>
					{/if}

					{#if clickedLogin && !clickedSignUp}
						<button
							class="join-button"
							style="background-color: {slides[currentSlide].buttonColor};"
							on:click={login}>Continue</button
						>
					{/if}
				</form>

				{#if clickedSignUp && !clickedLogin}
					<p>
						Already have an account? <button class="login-button" on:click={fakelogin}>Login</button
						>
					</p>
				{/if}

				{#if clickedLogin && !clickedSignUp}
					<p>
						Don't have an account? <button class="login-button" on:click={fakeSignUp}
							>Sign Up</button
						>
					</p>
					
				{/if}
			</div>
		{/if}
	</div>
	{#if showToast}
		<div class="toast {toastType}">
			<p>{toastMessage}</p>
		</div>
	{/if}
</main>

<style>
	.password-container {
    display: flex;
    align-items: center;
	justify-content: center;
    width: 100%;
}

.password-container input {
   width: 100%; 
   margin-left: 20px;
  /* Adjust spacing between input and button */
}

.showpass {
    display: flex;
    align-items: center;
}
.showpass button{
	cursor: pointer;
	margin-bottom: 14px;
	border: none;
	background-color: transparent;
	position: relative;
	right: 100%;
}
	
	.forgot {
		border: none;
		color: gray;
		background-color: transparent;
		cursor: pointer;
	}
	.error-label {
		color: red;
		font-size: 0.8rem;
		margin-top: -0.5rem;
		margin-bottom: 0.5rem;
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
		background-color: #037303;
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
	h2 {
		color: grey;
	}
	p {
		color: rgb(118, 118, 118);
	}

	.login-button {
		background-color: transparent;
		border: none;
		color: purple;
		font-size: 1.2em;
		cursor: pointer;
	}

	.slide-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		position: absolute;
		max-width: 300px;
		opacity: 0;
		transition: opacity 0.5s ease-in-out;
	}

	.visible {
		opacity: 1;
	}
	.solo {
		position: absolute;
		top: 80px;
		left: 320px;
		color: white;
	}
	.solo h2 {
		color: white;
	}
	.icon-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 90%;
		width: 70%;
		flex-direction: column;
	}
	.icon-container p {
		text-align: center;
		font-size: 16px;
		color: white;
		font-weight: 800;
	}

	.icon {
		width: 60%;
		height: 60%;
		opacity: 1;
	}

	main {
		margin: 0;
		padding: 0;
		min-height: 100vh;
		background-image: url($lib/node.jpg);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-attachment: fixed;
		display: flex;
		justify-content: center;
		align-items: center;
		font-family: 'Roboto';
	}

	.big-container {
		display: flex;
		height: 80vh;
		border: 2px solid rgba(255, 102, 0, 0.5);
		box-shadow: 0 10px 20px rgba(255, 102, 0, 0.3);
		width: 60vw;
	}

	.left-gradient {
		display: flex;
		justify-content: center;
		flex-direction: column;
		align-items: center;
		flex: 0.4;
		background: linear-gradient(to bottom right, #ff6600, #ff3300);
	}

	.right-content {
		flex: 0.6;
		background-color: #fff;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		align-items: center;
		border: 1px solid #ccc;
		border-radius: 10px;
		padding: 2rem;
		width: 70%;
	}

	.login-form input {
		width: 100%;
		padding: 0.5rem;
		margin-bottom: 1rem;
		border-radius: 5px;
		border: 1px solid #ccc;
	}

	.join-button {
		background-color: #ff6600;
		color: #fff;
		border: none;
		border-radius: 5px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		width: 240px;
		font-size: 1.2em;
	}
	@media only screen and (max-width: 1200px) {
		
		.left-gradient {
			display: none;
		}
		.right-content {
			width: 100%;
			background-color: #fff;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
		}

		.big-container {
			display: flex;
			height: 80vh;
			justify-content: center;
			align-items: center;
			border: 2px solid rgba(255, 102, 0, 0.5);
			box-shadow: 0 10px 20px rgba(255, 102, 0, 0.3);
			width: 90vw;
		}
	}
</style>
