let originalFile = null;
let resultImageUrl = null;
let apiKey = localStorage.getItem('removebg_api_key');

function init() {
    console.log("✅ Script loaded successfully!");

    const zone = document.getElementById('upload-zone');
    const input = document.getElementById('file-input');

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    // Drag support
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.style.borderColor = '#22d3ee';
    });
    zone.addEventListener('dragleave', () => zone.style.borderColor = '');
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.style.borderColor = '';
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
}

function handleFile(file) {
    console.log("📁 File selected:", file.name);
    
    if (!file.type.startsWith('image/')) {
        alert("Please select an image file");
        return;
    }

    originalFile = file;
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('original-preview').src = e.target.result;
        document.getElementById('preview-section').classList.remove('hidden');
        document.getElementById('controls-section').classList.remove('hidden');
        console.log("✅ Preview shown");
    };
    reader.readAsDataURL(file);
}

async function processImage() {
    if (!originalFile) return;

    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('submit-btn').disabled = true;
    document.getElementById('status-text').textContent = "Removing background...";

    if (!apiKey) {
        document.getElementById('api-modal').classList.remove('hidden');
        return;
    }

    try {
        updateProgress(20);

        const formData = new FormData();
        formData.append('image_file', originalFile);

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': apiKey },
            body: formData
        });

        if (!response.ok) throw new Error("API Error");

        updateProgress(70);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Simple resize
        const finalBlob = await resizeImage(url);
        resultImageUrl = URL.createObjectURL(finalBlob);

        updateProgress(100);
        document.getElementById('result-preview').src = resultImageUrl;
        document.getElementById('result-section').classList.remove('hidden');

    } catch (error) {
        console.error(error);
        alert("Failed to remove background.\n\nMake sure your API key is correct.");
    } finally {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('submit-btn').disabled = false;
    }
}

function updateProgress(percent) {
    document.getElementById('progress-text').textContent = percent + "%";
}

async function resizeImage(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            canvas.getContext('2d').drawImage(img, 0, 0, 1024, 1024);
            canvas.toBlob(resolve, 'image/png');
        };
        img.src = url;
    });
}

function downloadResult() {
    if (resultImageUrl) {
        const a = document.createElement('a');
        a.href = resultImageUrl;
        a.download = 'background-removed.png';
        a.click();
    }
}

function saveApiKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (key) {
        apiKey = key;
        localStorage.setItem('removebg_api_key', apiKey);
        document.getElementById('api-modal').classList.add('hidden');
        processImage();
    }
}

window.onload = init;
