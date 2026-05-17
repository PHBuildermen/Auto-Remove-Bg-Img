let originalFile = null;
let resultImageUrl = null;

async function init() {
    console.log("✅ Script loaded");
    const zone = document.getElementById('upload-zone');
    const input = document.getElementById('file-input');

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', e => e.target.files[0] && handleFile(e.target.files[0]));
    
    // Drag & Drop
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = '#22d3ee'; });
    zone.addEventListener('dragleave', () => zone.style.borderColor = '');
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.style.borderColor = '';
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) return alert("Please upload an image");
    if (file.size > 10 * 1024 * 1024) return alert("Max 10MB");

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

    const loading = document.getElementById('loading-state');
    loading.classList.remove('hidden');
    document.getElementById('status-text').textContent = "Removing background (client-side)...";

    try {
        // Try client-side first (no API key)
        const resultBlob = await removeBackgroundClientSide(originalFile);
        resultImageUrl = URL.createObjectURL(resultBlob);

        document.getElementById('result-preview').src = resultImageUrl;
        document.getElementById('result-section').classList.remove('hidden');
    } catch (err) {
        console.error(err);
        alert("Client-side removal failed. Try a smaller image or use remove.bg API key.");
    } finally {
        loading.classList.add('hidden');
    }
}

// ==================== CLIENT-SIDE BACKGROUND REMOVAL ====================
async function removeBackgroundClientSide(file) {
    // Dynamically load the library
    if (!window.imglyRemoveBackground) {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1/dist/index.js";
        document.head.appendChild(script);
        
        await new Promise(resolve => {
            script.onload = resolve;
        });
    }

    const { removeBackground } = window.imglyRemoveBackground || {};
    if (!removeBackground) throw new Error("Failed to load remover");

    const imageBitmap = await createImageBitmap(file);
    const result = await removeBackground(imageBitmap, {
        model: "small",           // or "medium" for better quality
        output: { format: "image/png" }
    });

    return result;
}

function downloadResult() {
    if (!resultImageUrl) return;
    const a = document.createElement('a');
    a.href = resultImageUrl;
    a.download = 'clearcut-removed-bg.png';
    a.click();
}

window.onload = init;
