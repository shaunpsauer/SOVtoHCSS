/**
 * Main Application Module
 * 
 * This module serves as the entry point and orchestrator for the SOV to HCSS converter application.
 * It manages the multi-step workflow, navigation between steps, and application initialization.
 * Provides step validation and user interface state management.
 */

console.log('App module loaded');

// Application state management
let currentStep = 1;
const totalSteps = 3;

/**
 * Initializes the application when the page loads
 * Sets default values, initializes file handling, and prepares the UI
 */
function initializeApp() {
    // Set default date to current date for convenience
    document.getElementById('dateInput').valueAsDate = new Date();
    
    // Initialize file handling functionality (drag & drop, file selection)
    initializeFileHandling();
}

/**
 * Advances to the next step in the workflow
 * Validates current step requirements and triggers appropriate processing
 */
function nextStep() {
    if (currentStep === 1 && validateStep1()) {
        showStep(2);
        processFile(); // Process uploaded SOV file
    } else if (currentStep === 2) {
        showStep(3);
        generateOutput(); // Generate HCSS notes output
    }
}

/**
 * Returns to the previous step in the workflow
 * Allows users to review and modify previous selections
 */
function previousStep() {
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

/**
 * Displays the specified step and updates the UI accordingly
 * Updates step indicators, shows/hides sections, and configures navigation
 * @param {number} step - The step number to display (1, 2, or 3)
 */
function showStep(step) {
    currentStep = step;
    
    // Update step indicator styling to show progress
    document.querySelectorAll('.step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 < step) el.classList.add('completed');
        if (index + 1 === step) el.classList.add('active');
    });
    
    // Show/hide appropriate sections based on current step
    document.getElementById('configSection').style.display = step === 1 ? 'grid' : 'none';
    document.getElementById('mappingSection').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('outputSection').style.display = step === 3 ? 'block' : 'none';
    
    // Update navigation button visibility and functionality
    document.getElementById('backBtn').style.display = step > 1 ? 'block' : 'none';
    document.getElementById('nextBtn').textContent = step === 3 ? 'Start Over' : 'Next Step →';
    
    if (step === 3) {
        // Final step: change button to restart the application
        document.getElementById('nextBtn').onclick = () => location.reload();
    } else {
        // Other steps: continue to next step
        document.getElementById('nextBtn').onclick = nextStep;
    }
}

/**
 * Validates that all required fields are completed before proceeding from step 1
 * Ensures contractor selection, date selection, and file upload are complete
 * @returns {boolean} True if validation passes, false otherwise
 */
function validateStep1() {
    const contractor = document.getElementById('contractorSelect').value;
    const date = document.getElementById('dateInput').value;
    
    // Validate contractor selection
    if (!contractor) {
        alert('Please select a contractor');
        return false;
    }
    
    // Validate date selection
    if (!date) {
        alert('Please select a date');
        return false;
    }
    
    // Validate file upload
    if (!isFileSelected()) {
        alert('Please upload an SOV file');
        return false;
    }
    
    return true;
}

// Initialize application when DOM content is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp); 