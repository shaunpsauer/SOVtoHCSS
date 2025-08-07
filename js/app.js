// App Module
console.log('App module loaded');

// Step Management
let currentStep = 1;
const totalSteps = 3;

// Initialize the application
function initializeApp() {
    // Set default date
    document.getElementById('dateInput').valueAsDate = new Date();
    
    // Initialize file handling
    initializeFileHandling();
}

// Step Navigation
function nextStep() {
    if (currentStep === 1 && validateStep1()) {
        showStep(2);
        processFile();
    } else if (currentStep === 2) {
        showStep(3);
        generateOutput();
    }
}

function previousStep() {
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

function showStep(step) {
    currentStep = step;
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 < step) el.classList.add('completed');
        if (index + 1 === step) el.classList.add('active');
    });
    
    // Show/hide sections
    document.getElementById('configSection').style.display = step === 1 ? 'grid' : 'none';
    document.getElementById('mappingSection').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('outputSection').style.display = step === 3 ? 'block' : 'none';
    
    // Update navigation buttons
    document.getElementById('backBtn').style.display = step > 1 ? 'block' : 'none';
    document.getElementById('nextBtn').textContent = step === 3 ? 'Start Over' : 'Next Step →';
    
    if (step === 3) {
        document.getElementById('nextBtn').onclick = () => location.reload();
    } else {
        document.getElementById('nextBtn').onclick = nextStep;
    }
}

function validateStep1() {
    const contractor = document.getElementById('contractorSelect').value;
    const date = document.getElementById('dateInput').value;
    
    if (!contractor) {
        alert('Please select a contractor');
        return false;
    }
    if (!date) {
        alert('Please select a date');
        return false;
    }
    if (!isFileSelected()) {
        alert('Please upload an SOV file');
        return false;
    }
    return true;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 