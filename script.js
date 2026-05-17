let originalFile = null;
let originalImageUrl = null;
let resultImageUrl = null;
let apiKey = localStorage.getItem('removebg_api_key');

function init() {
    const fileInput = document.getElementById('file-input');
    const uploadZone = document.getElementById('upload-zone');

    // Drag & Drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('border-cyan-400', 'bg-cyan-950/30');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('border-cyan-400', 'bg-cyan-950/30');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('border-cyan-400', 'bg-cyan-950/30');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert("Please upload a valid image file (PNG, JPG, JPEG)");
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        alert("File too large. Maximum size is 10MB.");
        return;
    }

    originalFile = file;
    const reader = new FileReader();
    reader.onload = function(e) {
        originalImageUrl = e.target.result;
        document.getElementById('original-preview').src = originalImageUrl;
        document.getElementById('preview-section').classList.remove('hidden');
        document.getElementById('controls-section').classList.remove('hidden');
        document.getElementById('empty-state').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

async function processImage() {
    if (!originalFile) return;

    const resolution = parseInt(document.getElementById('resolution-select').value);
    const ratio = document.getElementById('ratio-select').value;

    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('submit-btn').disabled = true;

    if (!apiKey) {
        showApiModal();
        resetLoadingState();
        return;
    }

    try {
        const formData = new FormData();
        formData.append('image_file', originalFile);

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': apiKey },
            body: formData
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const blob = await response.blob();
        const bgRemovedUrl = URL.createObjectURL(blob);

        const resizedBlob = await resizeImage(bgRemovedUrl, resolution, ratio);
        resultImageUrl = URL.createObjectURL(resizedBlob);

        document.getElementById('result-preview').src = resultImageUrl;
        document.getElementById('result-section').classList.remove('hidden');
        document.getElementById('empty-state').classList.add('hidden');

    } catch (error) {
        console.error(error);
        alert("Processing failed. Please check your API key.\n\n" + error.message);
    } finally {
        resetLoadingState();
    }
}

async function resizeImage(imageUrl, targetSize, ratioStr) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = targetSize;
            let height = targetSize;

            const [wRatio, hRatio] = ratioStr.split(':').map(Number);
            const aspect = wRatio / hRatio;

            if (aspect > 1) height = Math.round(targetSize / aspect);
            else if (aspect < 1) width = Math.round(targetSize * aspect);

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
        };
        img.src = imageUrl;
    });
}

function downloadResult() {
    if (!resultImageUrl) return;
    const link = document.createElement('a');
    link.href = resultImageUrl;
    link.download = `clearcut-${Date.now()}.png`;
    link.click();
}

function resetLoadingState() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('submit-btn').disabled = false;
}

function resetApp() {
    originalFile = null;
    originalImageUrl = null;
    resultImageUrl = null;

    document.getElementById('preview-section').classList.add('hidden');
    document.getElementById('controls-section').classList.add('hidden');
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('file-input').value = '';
}

function showApiModal() {
    document.getElementById('api-modal').classList.remove('hidden');
    document.getElementById('api-key-input').focus();
}

function hideApiModal() {
    document.getElementById('api-modal').classList.add('hidden');
}

function saveApiKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (key) {
        apiKey = key;
        localStorage.setItem('removebg_api_key', apiKey);
        hideApiModal();
        processImage();
    } else {
        alert("Please enter a valid API key");
    }
}

function updateSizeOptions() {
    // Can be extended later
}

// Initialize
window.onload = init;
