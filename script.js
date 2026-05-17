let originalFile = null;
let resultImageUrl = null;
let apiKey = localStorage.getItem('removebg_api_key');
let progressInterval = null; // Track interval globally to clear it properly

function init() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');

    uploadZone.addEventListener('dragover', e => {
        e.preventDefault();
        uploadZone.style.borderColor = '#22d3ee';
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = '';
    });

    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.style.borderColor = '';
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', e => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert("Please upload an image file!");
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        alert("File is too big! Max 10MB");
        return;
    }

    originalFile = file;
    const reader = new FileReader();
    reader.onload = () => {
        // Hide the upload zone to focus on the preview and controls
        document.getElementById('upload-zone').classList.add('hidden');
        document.getElementById('original-preview').src = reader.result;
        document.getElementById('preview-section').classList.remove('hidden');
        document.getElementById('controls-section').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

async function processImage() {
    if (!originalFile) return;

    // Correctly hide the empty state and show loading
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('submit-btn').disabled = true;

    if (!apiKey) {
        document.getElementById('api-modal').classList.remove('hidden');
        resetUI();
        return;
    }

    try {
        simulateProgress(); 

        const formData = new FormData();
        formData.append('image_file', originalFile);
        formData.append('size', 'auto'); // Helps the API know to preserve quality

        const res = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': apiKey },
            body: formData
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`API Error: ${res.status} - Please check your API key.`);
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        // Resize the image with proper aspect ratio containment
        const resolution = parseInt(document.getElementById('resolution-select').value);
        const ratio = document.getElementById('ratio-select').value;
        const finalBlob = await resizeImage(url, resolution, ratio);
        
        resultImageUrl = URL.createObjectURL(finalBlob);

        finishProgress(); // Push bar to 100%

        // Small delay so the user actually sees 100% before it switches
        setTimeout(() => {
            document.getElementById('result-preview').src = resultImageUrl;
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('result-section').classList.remove('hidden');
            document.getElementById('submit-btn').disabled = false;
        }, 500);

    } catch (err) {
        alert(err.message);
        console.error(err);
        resetUI();
    }
}

function simulateProgress() {
    let progress = 0;
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    
    if (progressInterval) clearInterval(progressInterval);
    
    progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 92) progress = 92;
        bar.style.width = progress + '%';
        text.textContent = Math.floor(progress) + '%';
        if (progress >= 92) clearInterval(progressInterval);
    }, 300);
}

function finishProgress() {
    if (progressInterval) clearInterval(progressInterval);
    document.getElementById('progress-bar').style.width = '100%';
    document.getElementById('progress-text').textContent = '100%';
}

async function resizeImage(imageUrl, targetSize, ratio) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = targetSize, h = targetSize;
            
            // Determine canvas dimensions based on ratio
            const [rw, rh] = ratio.split(':').map(Number);
            if (rw > rh) h = Math.round(targetSize * rh / rw);
            else w = Math.round(targetSize * rw / rh);

            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');

            // Calculate scaling to FIT the image without distorting it
            const scale = Math.min(w / img.width, h / img.height);
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            
            // Center the image in the canvas
            const offsetX = (w - drawW) / 2;
            const offsetY = (h - drawH) / 2;

            ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
            canvas.toBlob(blob => resolve(blob), 'image/png');
        };
        img.src = imageUrl;
    });
}

function downloadResult() {
    if (!resultImageUrl) return;
    const a = document.createElement('a');
    a.href = resultImageUrl;
    a.download = 'clearcut-no-bg.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function resetUI() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('submit-btn').disabled = false;
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('progress-text').textContent = '0%';
    
    // If the result isn't visible, bring back the empty state
    if (document.getElementById('result-section').classList.contains('hidden')) {
        document.getElementById('empty-state').classList.remove('hidden');
    }
}

function resetApp() {
    location.reload();
}

function saveApiKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (key) {
        apiKey = key;
        localStorage.setItem('removebg_api_key', apiKey);
        document.getElementById('api-modal').classList.add('hidden');
        processImage();
    } else {
        alert("Please enter your API key");
    }
}

window.onload = init;
