let originalFile = null;
let resultImageUrl = null;
let apiKey = localStorage.getItem('removebg_api_key');

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
        document.getElementById('original-preview').src = reader.result;
        document.getElementById('preview-section').classList.remove('hidden');
        document.getElementById('controls-section').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

async function processImage() {
    if (!originalFile) return;

    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('submit-btn').disabled = true;

    if (!apiKey) {
        document.getElementById('api-modal').classList.remove('hidden');
        resetUI();
        return;
    }

    try {
        simulateProgress(); // Visual progress

        const formData = new FormData();
        formData.append('image_file', originalFile);

        const res = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': apiKey },
            body: formData
        });

        if (!res.ok) throw new Error("API Error - Check your API key");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        // Resize
        const finalBlob = await resizeImage(url, parseInt(document.getElementById('resolution-select').value), document.getElementById('ratio-select').value);
        resultImageUrl = URL.createObjectURL(finalBlob);

        document.getElementById('result-preview').src = resultImageUrl;
        document.getElementById('result-section').classList.remove('hidden');

    } catch (err) {
        alert("Error: " + err.message);
        console.error(err);
    } finally {
        resetUI();
    }
}

function simulateProgress() {
    let progress = 0;
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 92) progress = 92;
        bar.style.width = progress + '%';
        text.textContent = Math.floor(progress) + '%';
        if (progress >= 92) clearInterval(interval);
    }, 300);
}

async function resizeImage(imageUrl, targetSize, ratio) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = targetSize, h = targetSize;
            const [rw, rh] = ratio.split(':').map(Number);
            if (rw > rh) h = Math.round(targetSize * rh / rw);
            else w = Math.round(targetSize * rw / rh);

            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
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
    a.click();
}

function resetUI() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('submit-btn').disabled = false;
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('progress-text').textContent = '0%';
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
