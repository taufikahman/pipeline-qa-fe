import { TestCaseConfig } from './config-panel';

export interface TestCase {
  id: string;
  title: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  type: 'Positive' | 'Negative' | 'Edge Case' | 'Performance';
  steps: string[];
  expectedResult: string;
  prerequisites?: string;
}

export function generateTestCases(
  input: { type: 'jira' | 'manual', content: string, metadata?: any },
  config: TestCaseConfig,
  existingTestCases: TestCase[] = [],
  generateAdditional: boolean = false
): TestCase[] {
  // Mock AI generation - in a real app, this would call an AI API
  const testCases: TestCase[] = [];
  let idCounter = existingTestCases.length + 1;
  
  // Add some randomization factor to generate different variations
  const randomFactor = Math.random();
  
  // Extract key features from the input (simple keyword extraction)
  const hasLogin = /login|sign in|authenticate/i.test(input.content);
  const hasForm = /form|input|submit|field/i.test(input.content);
  const hasValidation = /validat|verif|check/i.test(input.content);
  const hasAPI = /api|endpoint|request|response/i.test(input.content);
  const hasSearch = /search|filter|query/i.test(input.content);
  
  // Generate functional test cases
  if (config.testType === 'functional' || config.testType === 'e2e') {
    if (hasLogin) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify successful login with valid credentials',
        priority: 'Critical',
        type: 'Positive',
        steps: [
          'Navigate to the login page',
          'Enter valid username in the username field',
          'Enter valid password in the password field',
          'Click the "Login" button'
        ],
        expectedResult: 'User is successfully authenticated and redirected to the dashboard',
        prerequisites: 'User account must exist with valid credentials'
      });
    }

    if (hasForm) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify form submission with all required fields',
        priority: 'High',
        type: 'Positive',
        steps: [
          'Navigate to the form page',
          'Fill in all required fields with valid data',
          'Click the "Submit" button',
          'Verify submission confirmation message appears'
        ],
        expectedResult: 'Form is successfully submitted and confirmation is displayed'
      });
    }

    if (hasSearch) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify search functionality returns relevant results',
        priority: 'High',
        type: 'Positive',
        steps: [
          'Navigate to the search page',
          'Enter a search query in the search field',
          'Click the search button or press Enter',
          'Verify results are displayed'
        ],
        expectedResult: 'Search returns relevant results matching the query'
      });
    }
  }

  // Generate negative test cases
  if (config.includeNegative) {
    if (hasLogin) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify login fails with invalid credentials',
        priority: 'High',
        type: 'Negative',
        steps: [
          'Navigate to the login page',
          'Enter invalid username',
          'Enter invalid password',
          'Click the "Login" button'
        ],
        expectedResult: 'Error message is displayed indicating invalid credentials, user is not authenticated'
      });
    }

    if (hasValidation) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify validation error for empty required fields',
        priority: 'Medium',
        type: 'Negative',
        steps: [
          'Navigate to the form',
          'Leave required fields empty',
          'Attempt to submit the form'
        ],
        expectedResult: 'Validation error messages are displayed for empty required fields'
      });
    }
  }

  // Generate edge case tests
  if (config.includeEdgeCases) {
    if (hasForm) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify form handles maximum character limit',
        priority: 'Medium',
        type: 'Edge Case',
        steps: [
          'Navigate to the form',
          'Enter text exceeding the maximum character limit in text fields',
          'Attempt to submit the form'
        ],
        expectedResult: 'Field either prevents input beyond limit or displays validation error'
      });

      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify form handles special characters',
        priority: 'Low',
        type: 'Edge Case',
        steps: [
          'Navigate to the form',
          'Enter special characters (!@#$%^&*) in text fields',
          'Submit the form'
        ],
        expectedResult: 'Form properly handles or sanitizes special characters'
      });
    }

    if (hasSearch) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify search with empty query',
        priority: 'Medium',
        type: 'Edge Case',
        steps: [
          'Navigate to the search page',
          'Leave search field empty',
          'Click search button'
        ],
        expectedResult: 'Appropriate message is shown or all items are displayed'
      });
    }
  }

  // Generate performance tests
  if (config.includePerformance) {
    if (hasAPI) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify API response time under normal load',
        priority: 'Medium',
        type: 'Performance',
        steps: [
          'Send API request with valid parameters',
          'Measure response time',
          'Verify response is received within acceptable time'
        ],
        expectedResult: 'API responds within 2 seconds under normal load'
      });
    }

    testCases.push({
      id: `TC-${String(idCounter++).padStart(3, '0')}`,
      title: 'Verify page load time performance',
      priority: 'Medium',
      type: 'Performance',
      steps: [
        'Clear browser cache',
        'Navigate to the main page',
        'Measure page load time'
      ],
      expectedResult: 'Page loads within 3 seconds on standard connection'
    });
  }

  // Add more generic test cases based on coverage level
  if (config.coverage >= 70) {
    testCases.push({
      id: `TC-${String(idCounter++).padStart(3, '0')}`,
      title: 'Verify responsive design on mobile devices',
      priority: 'Medium',
      type: 'Positive',
      steps: [
        'Open the application on a mobile device or use responsive design mode',
        'Navigate through different pages',
        'Verify all elements are properly displayed and accessible'
      ],
      expectedResult: 'Application is fully responsive and usable on mobile devices'
    });

    testCases.push({
      id: `TC-${String(idCounter++).padStart(3, '0')}`,
      title: 'Verify browser compatibility',
      priority: 'Low',
      type: 'Positive',
      steps: [
        'Open the application in different browsers (Chrome, Firefox, Safari, Edge)',
        'Test core functionality in each browser',
        'Verify consistent behavior across browsers'
      ],
      expectedResult: 'Application works consistently across all major browsers'
    });
  }
  
  // Generate additional test cases if requested or with variations for regeneration
  if (generateAdditional || randomFactor > 0.5) {
    // Additional login tests
    if (hasLogin && config.includeNegative) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify account lockout after multiple failed login attempts',
        priority: 'High',
        type: 'Negative',
        steps: [
          'Navigate to the login page',
          'Enter invalid credentials and attempt login 5 times',
          'Verify account lockout message appears',
          'Attempt to login with correct credentials'
        ],
        expectedResult: 'Account is locked after exceeding maximum failed login attempts'
      });
      
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify password reset functionality',
        priority: 'High',
        type: 'Positive',
        steps: [
          'Navigate to login page',
          'Click "Forgot Password" link',
          'Enter registered email address',
          'Submit the form and check email for reset link'
        ],
        expectedResult: 'Password reset email is sent with valid reset link'
      });
    }
    
    // Additional form tests
    if (hasForm) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify form data persistence on page refresh',
        priority: 'Medium',
        type: 'Positive',
        steps: [
          'Navigate to the form',
          'Fill in some fields with valid data',
          'Refresh the page',
          'Verify entered data is preserved'
        ],
        expectedResult: 'Form data is preserved after page refresh (if auto-save enabled)'
      });
      
      if (config.includeEdgeCases) {
        testCases.push({
          id: `TC-${String(idCounter++).padStart(3, '0')}`,
          title: 'Verify form submission with minimum valid data',
          priority: 'Medium',
          type: 'Edge Case',
          steps: [
            'Navigate to the form',
            'Fill only required fields with minimum valid values',
            'Submit the form'
          ],
          expectedResult: 'Form is accepted with minimum required data'
        });
      }
    }
    
    // Additional search tests
    if (hasSearch) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify search with special characters',
        priority: 'Medium',
        type: 'Edge Case',
        steps: [
          'Navigate to search page',
          'Enter special characters in search field',
          'Execute search'
        ],
        expectedResult: 'Search handles special characters gracefully without errors'
      });
      
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify search results pagination',
        priority: 'Medium',
        type: 'Positive',
        steps: [
          'Execute search that returns many results',
          'Verify pagination controls appear',
          'Navigate through different pages',
          'Verify correct results on each page'
        ],
        expectedResult: 'Pagination works correctly and displays appropriate results per page'
      });
    }
    
    // Additional API and integration tests
    if (hasAPI) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify API error handling for invalid requests',
        priority: 'High',
        type: 'Negative',
        steps: [
          'Send API request with invalid parameters',
          'Verify appropriate error response is returned',
          'Check that error message is user-friendly'
        ],
        expectedResult: 'API returns proper error code and descriptive error message'
      });
      
      if (config.includePerformance) {
        testCases.push({
          id: `TC-${String(idCounter++).padStart(3, '0')}`,
          title: 'Verify API handles concurrent requests',
          priority: 'Medium',
          type: 'Performance',
          steps: [
            'Send multiple API requests simultaneously',
            'Verify all requests are processed',
            'Check response times remain acceptable'
          ],
          expectedResult: 'API handles concurrent requests without degradation'
        });
      }
    }
    
    // Additional accessibility and usability tests
    if (config.coverage >= 80) {
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify keyboard navigation functionality',
        priority: 'Medium',
        type: 'Positive',
        steps: [
          'Navigate the application using only keyboard (Tab, Enter, Arrow keys)',
          'Verify all interactive elements are accessible',
          'Check focus indicators are visible'
        ],
        expectedResult: 'All functionality is accessible via keyboard navigation'
      });
      
      testCases.push({
        id: `TC-${String(idCounter++).padStart(3, '0')}`,
        title: 'Verify screen reader compatibility',
        priority: 'Low',
        type: 'Positive',
        steps: [
          'Enable screen reader (JAWS, NVDA, or VoiceOver)',
          'Navigate through the application',
          'Verify all content and controls are announced properly'
        ],
        expectedResult: 'Application is fully accessible with screen readers'
      });
    }
  }

  // Filter by priority if needed
  const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  const minPriority = config.priority === 'critical' ? 4 
    : config.priority === 'high' ? 3 
    : config.priority === 'medium' ? 2 
    : 1;

  const filteredTestCases = config.priority === 'all' 
    ? testCases 
    : testCases.filter(tc => priorityOrder[tc.priority] >= minPriority);

  return filteredTestCases;
}
