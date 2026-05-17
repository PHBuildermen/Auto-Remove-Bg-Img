let originalFile = null;
let resultImageUrl = null;

function triggerFileSelect() {
    document.getElementById('file-input').click();
}

function init() {
    console.log("%c✅ Script Loaded Successfully", "color: cyan; font-size: 16px");

    const fileInput = document.getElementById('file-input');
    
    fileInput.addEventListener('change', function(e) {
        console.log("📸 File input changed", e.target.files);
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });

    // Click on upload zone also opens file picker
    document.getElementById('upload-zone').addEventListener('click', function(e) {
        if (e.target.tagName !== "BUTTON") {
            triggerFileSelect();
        }
    });
}

function handleFile(file) {
    console.log("✅ File selected:", file.name, file.type);

    if (!file.type.startsWith('image/')) {
        alert("Please select a valid image file");
        return;
    }

    originalFile = file;

    const reader = new FileReader();
    reader.onload = function(e) {
        console.log("✅ Image loaded into preview");
        document.getElementById('original-preview').src = e.target.result;
        document.getElementById('preview-section').classList.remove('hidden');
        document.getElementById('controls-section').classList.remove('hidden');
        
        // Scroll to preview
        document.getElementById('preview-section').scrollIntoView({ behavior: "smooth" });
    };
    reader.readAsDataURL(file);
}

async function processImage() {
    if (!originalFile) {
        alert("Please upload an image first");
        return;
    }

    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('submit-btn').disabled = true;
    document.getElementById('status-text').textContent = "Removing background...";

    try {
        // Simple client-side removal using canvas (for now)
        const resultBlob = await simpleBackgroundRemoval(originalFile);
        resultImageUrl = URL.createObjectURL(resultBlob);

        document.getElementById('result-preview').src = resultImageUrl;
        document.getElementById('result-section').classList.remove('hidden');
        
        document.getElementById('result-section').scrollIntoView({ behavior: "smooth" });
    } catch (err) {
        console.error(err);
        alert("Sorry, background removal failed. Try another image.");
    } finally {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('submit-btn').disabled = false;
    }
}

// Simple canvas-based removal (works immediately)
async function simpleBackgroundRemoval(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // For demo: just return the image as PNG with transparency support
            canvas.toBlob(resolve, 'image/png');
        };
        img.src = URL.createObjectURL(file);
    });
}

function downloadResult() {
    if (resultImageUrl) {
        const link = document.createElement('a');
        link.href = resultImageUrl;
        link.download = 'clearcut-no-background.png';
        link.click();
    }
}

window.onload = init;
