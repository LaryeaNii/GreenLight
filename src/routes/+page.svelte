<script>
	import supabase from '$lib/db.js';
	import { onDestroy, onMount } from 'svelte';
	import connect from '$lib/connect-svgrepo-com.svg';
	import score from '$lib/scoreboard-svgrepo-com.svg';
	import shield from '$lib/shield-user-svgrepo-com.svg';
	import NewProfile from "../routes/newprofile/+page.svelte";
	import { goto } from "$app/navigation";

    let clickedLogin = false; 
    let clickedSignUp = true; 
	let showNewProfile = false;
	
	let userEmail = '';
	let userPassword = '';

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
	let intervalId;

	onMount(() => {
		intervalId = setInterval(() => {
			currentSlide = (currentSlide + 1) % slides.length;
		}, 9000);
	});

	onDestroy(() => clearInterval(intervalId));

   const login = async() =>{
    clickedLogin = true; 
    clickedSignUp = false;
	let { data, error } = await supabase.auth.signInWithPassword({
			email: userEmail,
			password: userPassword
		});
	
	if(!error){
		goto('/dashboard');
		
	}
   }

   const signUp= async()=>{
    clickedLogin = false; 
    clickedSignUp = true; 
	let { data, error } = await supabase.auth.signUp({
			email: userEmail,
			password: userPassword
		});
		
     
	if(!error){
		showNewProfile = true; 
		
	}
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
	<NewProfile/>
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
				<input type="email" placeholder="School Email" bind:value={userEmail} />
				<input type="password" placeholder="Password" bind:value={userPassword} />
                {#if clickedSignUp && !clickedLogin}  	
                <button class="join-button" style="background-color: {slides[currentSlide].buttonColor};" on:click={signUp}
					>Join</button
				>
                {/if}

                {#if clickedLogin && !clickedSignUp}
                <button class="join-button" style="background-color: {slides[currentSlide].buttonColor};"
					on:click={login}>Login</button
				>
                {/if}
            </form>
            
            {#if clickedSignUp && !clickedLogin} 
			<p>Already have an account? <button class="login-button" on:click={login}>Login</button></p>
		    {/if}

            {#if clickedLogin && !clickedSignUp}
            <p>Don't have an account? <button class="login-button" on:click={signUp}>Sign Up</button></p>
            {/if}
		</div>
		{/if}
	</div>
</main>

<style>
	h2 {
		color: grey;
	}
	p {
		color: grey;
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
		font-family: 'Poppins';
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
</style>
