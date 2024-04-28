<script>
    import  supabase  from '$lib/db';
    import { goto } from "$app/navigation";  
  
    let schoolName = '';
    let location = '';
    let phoneNumber = '';
    let websiteUrl = '';
   
  

  
    async function handleSubmit() {
        const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }
  
      const { data, error } = await supabase
        .from('schools')
        .insert([
          {
            schoolName: schoolName,
            location: location, 
            phone: phoneNumber,
            website: websiteUrl,
            schoolkey: user.id,
            school_email: user.email
          }
        ]);
  
      if (error) {
        console.error('Error inserting school data:', error);
      } else {
        console.log('School data inserted successfully:', data);
        // Reset form fields if needed
        schoolName = '';
        location = '';
        phoneNumber = '';
        websiteUrl = '';
        goto('/dashboard');
      }
     
    }
    
  </script>
  

  
  <main>
    <h2>Before we get started, tell us more about your institution</h2>
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="schoolName">School Name</label>
        <input
          type="text"
          id="schoolName"
          bind:value={schoolName}
          required
          class="form-control"
        />
      </div>
      <div class="form-group">
        <label for="location">Location (GPS)</label>
        <input
          type="text"
          id="location"
          bind:value={location}
          required
          class="form-control"
        />
      </div>
      <div class="form-group">
        <label for="phoneNumber">Phone Number</label>
        <input
          type="tel"
          id="phoneNumber"
          bind:value={phoneNumber}
          required
          class="form-control"
        />
      </div>
      <div class="form-group">
        <label for="websiteUrl">Website URL</label>
        <input
         
          id="websiteUrl"
          bind:value={websiteUrl}
          
          class="form-control"
        />
      </div>
      <label>
        <input type="checkbox" required/> I consent to providing data freely to the service 
      </label>
      <br>
      <button type="submit" class="submit-btn">Submit</button>
    </form>
  </main>
  
  <style>
    main {
      width: 100%;
      margin: 20px;
      margin-left: 40px;
      margin-right: 40px;
      padding: 20px;
      font-family: Arial, sans-serif;
      background-color: white;
    }
  
    h2 {
      text-align: center;
      margin-bottom: 20px;
      color: grey;
    }
  
    .form-group {
      margin-bottom: 20px;
    }
  
    label {
      display: block;
      font-weight: bold;
      margin-bottom: 5px;
      color: grey;
    }
  
    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
      font-size: 16px;
    }
  
    .submit-btn {
      background-color: #4CAF50;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
  
    .submit-btn:hover {
      background-color: #45a049;
    }
    @media only screen and (max-width: 768px) {
      h2{
        font-size: 18px;
        text-align: left;
        margin-top: 14px;
      }
    }
  </style>