<script>
	import supabase from '$lib/db.js';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import LogOut from '$lib/logout-2-svgrepo-com.svg';
	import dashboard from '$lib/dashboard-svgrepo-com.svg';
	import addnewstudent from '$lib/add-new-plus-app-dev-interface-2-svgrepo-com.svg';
	import mystudents from '$lib/people-svgrepo-com.svg';
	import edit from '$lib/edit.svg';
	import settings from '$lib/settings.svg';
	import transfer from '$lib/transfer.svg';

	let schooldata; // Initialize with null to indicate loading state
	let hide = false;

	export let active; // Allow passing an initial active state (optional)
	export const links = [
		{ text: 'Dashboard', path: '/dashboard' },
		{ text: 'Add New', path: '/addNew' },
		{ text: 'Settings', path: '/profile' },
		{ text: 'My Students', path: '/myStudents' },
		{ text: 'Parent Edit Requests', path: '/permissions' },
		{ text: 'Student Transfers', path: '/transfers' }
	]; // Explicitly define link objects

	function handleClick(index) {
		active = index;
		goto(links[index - 1].path); // Access path based on index
	}

	async function loadName() {
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (!user) {
			console.error('User is not logged in');
			goto('/');
			return;
		}

		const { data: thedata, error } = await supabase
			.from('schools')
			.select('*')
			.eq('schoolkey', user.id);

		if (error) {
			console.error('Error fetching school data:', error);
			return;
		}

		if (thedata.length === 0) {
			console.log('No school data found for user ID:', user.id);
		} else {
			schooldata = thedata[0];
			console.log(schooldata);
		}
	}

	onMount(loadName);

	const logOut = async () => {
		let { error } = await supabase.auth.signOut();

		goto('/');
	};
</script>

<div class="nav">
	<div class="nav-header">
		<div class="nav-title">
			{schooldata ? `${schooldata.schoolName}` : 'GreenLight'}
		</div>
	</div>

	<div class="nav-links">
		<button
			type="button"
			class="custom-link"
			on:click={() => handleClick(1)}
			class:active={active === 1}
		>
			<div class="logo-menu">
				<img src={dashboard} alt="dashboard" class="logo" />
				<div class="hide" class:hidden-material={hide}>{links[0].text}</div>
			</div>
		</button>

		<button
			type="button"
			class="custom-link"
			on:click={() => handleClick(2)}
			class:active={active === 2}
		>
			<div class="logo-menu">
				<img src={addnewstudent} alt="addnew" class="logo" />
				<div class="hide" class:hidden-material={hide}>{links[1].text}</div>
			</div>
		</button>

		<button
			type="button"
			class="custom-link"
			on:click={() => handleClick(4)}
			class:active={active === 4}
		>
			<div class="logo-menu">
				<img src={mystudents} alt="mystudents" class="logo" />
				<div class="hide" class:hidden-material={hide}>{links[3].text}</div>
			</div>
		</button>

		<button
			type="button"
			class="custom-link"
			on:click={() => handleClick(5)}
			class:active={active === 5}
		>
			<div class="logo-menu">
				<img src={edit} alt="profile-edit" class="logo" />
				<div class="hide" class:hidden-material={hide}>{links[4].text}</div>
			</div>
		</button>

		<button
			type="button"
			class="custom-link"
			on:click={() => handleClick(6)}
			class:active={active === 6}
		>
			<div class="logo-menu">
				<img src={transfer} alt="profile-edit" class="logo" />
				<div class="hide" class:hidden-material={hide}>{links[5].text}</div>
			</div>
		</button>
	</div>
	<div class="logs">
		<div class="logoutmenu">
			<button class="last-last" on:click={logOut}>
			<div class="logo-menu">
				<img src={LogOut} alt="logout" />
				<div class="hide">Logout</div>
			</div>
		</button>
		</div>
		<div class="logoutmenu" id="profile-page">
			<button class="last-last" type="button" on:click={() => handleClick(3)}>
				<div class="logo-menu">
					<img class="settings-pic" src={settings} alt="profile-edit" />
					<div class="hide">{links[2].text}</div>
				</div>
			</button>
		</div>	
	</div>
	
</div>

<style>
	* {
		box-sizing: border-box;
		font-family: 'Roboto';
	}
	.hidden-material {
		visibility: hidden;
	}
	
	.nav-title {
		margin-top: 29px;
		font-size: 17px;
		border: 1px solid white;
		width: 90%;
	}
	.logo {
		padding: 1px;
	}
	.logo-menu {
		display: flex;
		gap: 10px;
		
	}

	.logoutmenu {
		display: flex;
		width: 200px;
		position: absolute;
		bottom: 80px;
		left: 0px;
		background-color: transparent;
		padding-left: 10px;
		border: 1px white solid;
		
	}
	.last-last {
		font-weight: 600;
		font-size: 15px;
		bottom: 70px;
		left: 10px;
		border: none;
		cursor: pointer;
		color: white;
		background-color: transparent;
	}
	.nav {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #000000;
		position: relative;
		width: 200px;
		gap: 40px;
	}

	.nav > .nav-header {
		display: inline;
	}

	.nav > .nav-header > .nav-title {
		display: inline-block;
		font-size: 22px;
		color: #fff;
		padding: 10px 10px 10px 10px;
	}

	.custom-link {
		/* Default styles for all buttons */
		display: inline-block;
		padding: 10px;
		margin: 5px;
		border: 1px solid #ddd;
		cursor: pointer;
		background-color: transparent;
		color: white;
		text-align: left;
		width: 187px;
	}
	.custom-link:hover {
		color: white;
		border: 1px solid greenyellow;
	}

	.active {
		/* Styles for the active button */
		color: white;
		border: 2px solid greenyellow
	}
	.nav-links {
		display: flex;
		flex-direction: column;
		position: absolute;
		top: 180px;
	}
	#profile-page{
      position: absolute;
	  bottom: 100px;
	  border: 1px solid white;
	  width: 200px;
	  right: 80px;
	  margin-left: -0px;
      margin-bottom: 10px;
	}

	@media only screen and (max-width: 768px) {
    .nav {
        flex-direction: row;
        height: 70px;
        width: 100%;
        position: fixed;
        bottom: 0;
        left: 0;
        justify-content: space-around;
        padding: 10px;
        box-sizing: border-box;
        z-index: 1; /* Ensure the navbar appears above other content */
    }
	.active {
		/* Styles for the active button */
		background-color: green;
		border-radius: 10%;
		
	}
	.nav-title{
		display: none !important;
	}

    .nav-header {
        display: none; /* Hide the header */
    }

    .nav-links {
		display: flex;
        flex-direction: row;
		justify-content: space-evenly;
        position: static;
        top: auto;
		right: 10px;
		margin-right: 40px;
    }

    .custom-link {
        width: auto;
        padding: 5px;
        margin: 10px;
        border: none;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .hide {
        display: none; /* Hide the text */
    }

    
	.logs{
		position: absolute;
		top: -430px;
		right: 35px;
		width: 10px;
		background-color: rgb(0, 0, 0);
	}
	.logoutmenu {
		display: flex;
		width: fit-content;
		background-color: black;
		border: 1px white solid;
		
	}
	.last-last {
		font-weight: 600;
		font-size: 15px;
		bottom: 70px;
		left: 10px;
		border: none;
		cursor: pointer;
		color: white;
		background-color: transparent;
	}
	#profile-page{
	  bottom: 100px;
	  border: 1px solid white;
	  width: fit-content;
	 
	
	}
  
}
</style>
