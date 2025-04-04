// Rate Limiting Stress Test for Logday (Signup and Login)
(async function stressTestRateLimiting() {
  // Configuration
  const supabaseUrl = 'https://nusvmmtwguxhgaaezgwy.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51c3ZtbXR3Z3V4aGdhYWV6Z3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDE2MTUsImV4cCI6MjA1MTQxNzYxNX0.L6pVxIuOkCIhj1i_9Bvt6PibmXhC6ZiLfQPN17WJW14';
  
  // Utility functions
  function generateRandomEmail() {
    return `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  }
  
  async function resetAllLimits(email, testId) {
    console.log(`Resetting limits for ${email || 'no email'} and ${testId || 'current IP'}`);
    
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/auth-ratelimit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            action: 'reset_limits',
            email: email,
            testIdentifier: testId,
          }),
        }
      );
      
      const data = await response.json();
      console.log(`Reset response:`, data);
      return data;
    } catch (error) {
      console.error('Reset error:', error);
      return { error };
    }
  }
  
  // Signup Testing Functions
  async function checkSignupRateLimit(email, testId) {
    console.log(`Checking signup rate limit for ${email || 'no email'} with ${testId || 'current IP'}`);
    
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/auth-ratelimit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            action: 'check_signup_limits',
            email: email,
            testIdentifier: testId,
          }),
        }
      );
      
      const data = await response.json();
      console.log(`Signup check response (${response.status}):`, data);
      return { status: response.status, data };
    } catch (error) {
      console.error('Signup check error:', error);
      return { status: 500, error };
    }
  }
  
  async function recordFailedSignup(email) {
    console.log(`Recording failed signup for ${email}`);
    
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/auth-ratelimit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            action: 'record_failed_signup',
            email: email,
          }),
        }
      );
      
      const data = await response.json();
      console.log(`Signup record response (${response.status}):`, data);
      return { status: response.status, data };
    } catch (error) {
      console.error('Signup record error:', error);
      return { status: 500, error };
    }
  }
  
  // Login Testing Functions
  async function checkLoginRateLimit(email, testId) {
    console.log(`Checking login rate limit for ${email || 'no email'} with ${testId || 'current IP'}`);
    
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/auth-ratelimit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            action: 'check_login_limits',
            email: email,
            testIdentifier: testId,
          }),
        }
      );
      
      const data = await response.json();
      console.log(`Login check response (${response.status}):`, data);
      return { status: response.status, data };
    } catch (error) {
      console.error('Login check error:', error);
      return { status: 500, error };
    }
  }
  
  async function recordFailedLogin(email) {
    console.log(`Recording failed login for ${email}`);
    
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/auth-ratelimit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            action: 'record_failed_login',
            email: email,
          }),
        }
      );
      
      const data = await response.json();
      console.log(`Login record response (${response.status}):`, data);
      return { status: response.status, data };
    } catch (error) {
      console.error('Login record error:', error);
      return { status: 500, error };
    }
  }
  
  // UI for test results
  function createResultsUI() {
    const resultDiv = document.createElement('div');
    resultDiv.style.position = 'fixed';
    resultDiv.style.top = '10px';
    resultDiv.style.right = '10px';
    resultDiv.style.width = '400px';
    resultDiv.style.padding = '15px';
    resultDiv.style.backgroundColor = '#f0f0f0';
    resultDiv.style.border = '1px solid #ccc';
    resultDiv.style.borderRadius = '5px';
    resultDiv.style.zIndex = '9999';
    resultDiv.style.maxHeight = '80vh';
    resultDiv.style.overflow = 'auto';
    resultDiv.style.fontFamily = 'monospace';
    resultDiv.innerHTML = '<h3>Rate Limiting Tests</h3><div id="test-results"></div>';
    document.body.appendChild(resultDiv);
    return document.getElementById('test-results');
  }
  
  function addResult(resultsDiv, label, success, message) {
    const item = document.createElement('div');
    item.style.margin = '5px 0';
    item.style.padding = '5px';
    item.style.backgroundColor = success ? '#d4edda' : '#f8d7da';
    item.style.borderRadius = '3px';
    item.innerHTML = `<strong>${label}:</strong> ${message}`;
    resultsDiv.appendChild(item);
    return item;
  }
  
  function addHeader(resultsDiv, text) {
    const header = document.createElement('h4');
    header.style.margin = '15px 0 5px 0';
    header.style.padding = '5px';
    header.style.backgroundColor = '#e2e3e5';
    header.style.borderRadius = '3px';
    header.style.textAlign = 'center';
    header.innerHTML = text;
    resultsDiv.appendChild(header);
  }
  
  // Signup Test Functions
  async function testSignupIPRateLimit(resultsDiv, testId) {
    addHeader(resultsDiv, "SIGNUP IP RATE LIMITING");
    
    // Reset limits first
    await resetAllLimits(null, testId);
    
    // Make 3 requests (should fail on the 3rd)
    for (let i = 1; i <= 3; i++) {
      const result = await checkSignupRateLimit(null, testId);
      
      if (i <= 2) {
        // First 2 requests should succeed
        const success = result.status === 200 && result.data?.allowed === true;
        addResult(
          resultsDiv, 
          `Signup IP Request ${i}/3`, 
          success,
          success ? 'Allowed as expected' : 'Failed unexpectedly'
        );
      } else {
        // 3rd request should be rate limited
        const success = result.status === 429 && result.data?.allowed === false;
        addResult(
          resultsDiv, 
          `Signup IP Request ${i}/3`, 
          success,
          success ? 'Rate limited as expected' : 'Not rate limited when it should be'
        );
      }
      
      // Short delay between requests
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  async function testSignupEmailRateLimit(resultsDiv) {
    const testEmail = generateRandomEmail();
    addHeader(resultsDiv, "SIGNUP EMAIL RATE LIMITING");
    addResult(resultsDiv, 'Test Email', true, testEmail);
    
    // Reset limits first
    await resetAllLimits(testEmail);
    
    // Record 4 failed attempts (should fail on the 4th)
    for (let i = 1; i <= 4; i++) {
      // Record a failed attempt
      await recordFailedSignup(testEmail);
      
      // Check if we're rate limited yet
      const result = await checkSignupRateLimit(testEmail);
      
      if (i <= 3) {
        // First 3 attempts should be allowed
        const success = result.status === 200 && result.data?.allowed === true;
        addResult(
          resultsDiv, 
          `Signup Email Attempt ${i}/4`, 
          success,
          success ? 'Allowed as expected' : 'Failed unexpectedly'
        );
      } else {
        // 4th attempt should be rate limited
        const success = result.status === 429 && result.data?.allowed === false;
        addResult(
          resultsDiv, 
          `Signup Email Attempt ${i}/4`, 
          success,
          success ? 'Rate limited as expected' : 'Not rate limited when it should be'
        );
      }
      
      // Short delay between requests
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // Login Test Functions
  async function testLoginIPRateLimit(resultsDiv, testId) {
    addHeader(resultsDiv, "LOGIN IP RATE LIMITING");
    
    // Reset limits first
    await resetAllLimits(null, testId);
    
    // Make 6 requests (should fail on the 6th)
    for (let i = 1; i <= 6; i++) {
      const result = await checkLoginRateLimit(null, testId);
      
      if (i <= 5) {
        // First 5 requests should succeed
        const success = result.status === 200 && result.data?.allowed === true;
        addResult(
          resultsDiv, 
          `Login IP Request ${i}/6`, 
          success,
          success ? 'Allowed as expected' : 'Failed unexpectedly'
        );
      } else {
        // 6th request should be rate limited
        const success = result.status === 429 && result.data?.allowed === false;
        addResult(
          resultsDiv, 
          `Login IP Request ${i}/6`, 
          success,
          success ? 'Rate limited as expected' : 'Not rate limited when it should be'
        );
      }
      
      // Short delay between requests
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  async function testLoginEmailRateLimit(resultsDiv) {
    const testEmail = generateRandomEmail();
    addHeader(resultsDiv, "LOGIN EMAIL RATE LIMITING");
    addResult(resultsDiv, 'Test Email', true, testEmail);
    
    // Reset limits first
    await resetAllLimits(testEmail);
    
    // Record 6 failed attempts (should fail on the 6th)
    for (let i = 1; i <= 6; i++) {
      // Record a failed attempt
      await recordFailedLogin(testEmail);
      
      // Check if we're rate limited yet
      const result = await checkLoginRateLimit(testEmail);
      
      if (i <= 5) {
        // First 5 attempts should be allowed
        const success = result.status === 200 && result.data?.allowed === true;
        addResult(
          resultsDiv, 
          `Login Email Attempt ${i}/6`, 
          success,
          success ? 'Allowed as expected' : 'Failed unexpectedly'
        );
      } else {
        // 6th attempt should be rate limited
        const success = result.status === 429 && result.data?.allowed === false;
        addResult(
          resultsDiv, 
          `Login Email Attempt ${i}/6`, 
          success,
          success ? 'Rate limited as expected' : 'Not rate limited when it should be'
        );
      }
      
      // Short delay between requests
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // Run all tests
  async function runAllTests() {
    const resultsDiv = createResultsUI();
    const testId = `test-${Date.now()}`;
    
    addResult(resultsDiv, 'Test Suite', true, 'Starting rate limit test suite...');
    
    // Add test selection UI
    addHeader(resultsDiv, "SELECT TESTS TO RUN");
    
    const testButtons = document.createElement('div');
    testButtons.style.display = 'flex';
    testButtons.style.flexWrap = 'wrap';
    testButtons.style.gap = '5px';
    testButtons.style.marginBottom = '10px';
    
    const tests = [
      { name: "All Tests", fn: async () => {
        await testSignupIPRateLimit(resultsDiv, `${testId}-signup-ip`);
        await testSignupEmailRateLimit(resultsDiv);
        await testLoginIPRateLimit(resultsDiv, `${testId}-login-ip`);
        await testLoginEmailRateLimit(resultsDiv);
      }},
      { name: "Signup IP Test", fn: () => testSignupIPRateLimit(resultsDiv, `${testId}-signup-ip`) },
      { name: "Signup Email Test", fn: () => testSignupEmailRateLimit(resultsDiv) },
      { name: "Login IP Test", fn: () => testLoginIPRateLimit(resultsDiv, `${testId}-login-ip`) },
      { name: "Login Email Test", fn: () => testLoginEmailRateLimit(resultsDiv) }
    ];
    
    tests.forEach(test => {
      const button = document.createElement('button');
      button.innerText = test.name;
      button.style.padding = '5px 10px';
      button.style.backgroundColor = '#007bff';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '3px';
      button.style.cursor = 'pointer';
      button.onclick = async () => {
        button.disabled = true;
        button.style.backgroundColor = '#6c757d';
        await test.fn();
        button.disabled = false;
        button.style.backgroundColor = '#28a745';
        addResult(resultsDiv, 'Test Complete', true, `${test.name} completed!`);
      };
      testButtons.appendChild(button);
    });
    
    resultsDiv.appendChild(testButtons);
  }
  
  // Start the tests
  runAllTests();
})();