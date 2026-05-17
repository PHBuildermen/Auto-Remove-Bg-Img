// ==========================================
// 1. API CONFIGURATION
// ==========================================
const REMOVE_BG_API_KEY = 'Ln5WMsBZiZkBven7BztxxQsH';

// ==========================================
// 2. DOM ELEMENTS
// ==========================================
const imageInput = document.getElementById('imageInput');
const previewSection = document.getElementById('previewSection');
const optionsSection = document.getElementById('optionsSection');
const resultSection = document.getElementById('resultSection');
const imagePreview = document.getElementById('imagePreview');
const imageResult = document.getElementById('imageResult');
const submitBtn = document.getElementById('submitBtn');
const downloadBtn = document.getElementById('downloadBtn');
const errorMessage = document.getElementById('errorMessage');
const sizeSelect = document.getElementById('sizeSelect');
const ratioSelect = document.getElementById('ratioSelect');

let selectedFile = null;
let processedBlob = null;

// ==========================================
// 3. EVENT LISTENERS
// ==========================================

// Handle Image Selection
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        showError("Invalid file type. Please upload a JPG or PNG.");
        return;
    }

    selectedFile = file;
    
    // Show Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewSection.style.display = 'block';
        optionsSection.style.display = 'block';
        resultSection.style.display = 'none'; // Hide previous results
        errorMessage.textContent = ''; // Clear errors
    };
    reader.readAsDataURL(file);
});

// Handle Background Removal Submit
submitBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    if (REMOVE_BG_API_KEY === 'PASTE_YOUR_API_KEY_HERE' || REMOVE_BG_API_KEY === '') {
        showError("Error: Please paste a valid Remove.bg API key in script.js");
        return;
    }

    // Set Loading State
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing (Please wait)...';
    errorMessage.textContent = '';
    resultSection.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('image_file', selectedFile);
        formData.append('size', 'auto'); // Let the API return best size

        // Call Remove.bg API
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const blob = await response.blob();
        
        // Process sizing and ratio via Canvas
        await processAndDisplayFinalImage(blob);

    } catch (error) {
        showError("Failed to process image. " + error.message);
    } finally {
        // Reset Button State
        submitBtn.disabled = false;
        submitBtn.textContent = 'Remove Background';
    }
});

// Handle Download
downloadBtn.addEventListener('click', () => {
    if (!processedBlob) return;
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'no-bg-result.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================

// Draw API result to canvas to apply Size and Ratio logic
async function processAndDisplayFinalImage(imageBlob) {
    const imgURL = URL.createObjectURL(imageBlob);
    const img = new Image();
    
    img.onload = () => {
        // Calculate dimensions based on user selection
        let finalWidth = img.width;
        let finalHeight = img.height;

        // 1. Apply Size (Width)
        const sizeVal = sizeSelect.value;
        if (sizeVal !== 'original') {
            finalWidth = parseInt(sizeVal);
            finalHeight = (img.height / img.width) * finalWidth; // Keep ratio initially
        }

        // 2. Apply Aspect Ratio (Modifies Height based on new Width)
        const ratioVal = ratioSelect.value;
        if (ratioVal !== 'original') {
            const [wRatio, hRatio] = ratioVal.split(':').map(Number);
            finalHeight = (finalWidth / wRatio) * hRatio;
        }

        // 3. Draw on Canvas
        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');

        // Center the image inside the new layout bounds seamlessly
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Convert canvas back to blob for download/display
        canvas.toBlob((newBlob) => {
            processedBlob = newBlob;
            imageResult.src = URL.createObjectURL(newBlob);
            resultSection.style.display = 'block';
            
            // Scroll to result smoothly
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }, 'image/png');
    };
    img.src = imgURL;
}

function showError(msg) {
    errorMessage.textContent = msg;
}
