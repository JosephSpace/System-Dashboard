async function updateSystemMetrics() {
    try {
        const response = await fetch('http://localhost:5000/system-info');
        const data = await response.json();
        
        // RAM güncelleme
        document.getElementById('ramValue').textContent = `${data.ram.percent.toFixed(1)}%`;
        document.getElementById('ramDetails').textContent = 
            `${formatBytes(data.ram.used)} / ${formatBytes(data.ram.total)}`;
        document.getElementById('ramBar').style.width = `${data.ram.percent}%`;

        // CPU güncelleme
        document.getElementById('cpuValue').textContent = `${data.cpu.percent.toFixed(1)}%`;
        document.getElementById('cpuDetails').textContent = 
            `${data.cpu.cores} çekirdek`;
        document.getElementById('cpuBar').style.width = `${data.cpu.percent}%`;

        // Disk güncelleme
        document.getElementById('diskValue').textContent = `${data.disk.percent.toFixed(1)}%`;
        document.getElementById('diskDetails').textContent = 
            `${formatBytes(data.disk.used)} / ${formatBytes(data.disk.total)}`;
        document.getElementById('diskBar').style.width = `${data.disk.percent}%`;

    } catch (error) {
        console.error('Veri alma hatası:', error);
    }
}

async function updateProcessList() {
    try {
        const response = await fetch('http://localhost:5000/processes');
        let processes = await response.json();

        // Süreçleri CPU kullanımına göre sırala
        processes.sort((a, b) => parseFloat(b.cpu) - parseFloat(a.cpu));

        const tableBody = document.getElementById('processTable');
        tableBody.innerHTML = processes.map(process => `
            <tr>
                <td>${process.name}</td>
                <td>${process.pid}</td>
                <td>${process.memory}</td>
                <td>${process.cpu}</td>
                <td>
                    <div class="process-bar">
                        <div class="process-bar-fill" 
                             style="width: ${parseFloat(process.cpu)}%"></div>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Process listesi alma hatası:', error);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 GB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = '/html/login.html';
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/html/login.html';
}

// CPU bilgisini al ve göster
async function getCPUInfo() {
    try {
        const response = await fetch('http://localhost:5000/api/cpu-info');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // CPU detaylarını güncelle
        document.getElementById('cpuDetails').textContent = 
            `${data.model} (${data.cores} çekirdek)`;
    } catch (error) {
        console.error('CPU bilgisi alınamadı:', error);
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // İlk verileri yükle
    updateSystemMetrics();
    updateProcessList();
    
    // Periyodik güncelleme
    setInterval(updateSystemMetrics, 1000);  // Her 1 saniyede bir sistem metriklerini güncelle
    setInterval(updateProcessList, 2000);    // Her 2 saniyede bir process listesini güncelle

    // Sayfa yüklendiğinde CPU bilgisini al
    getCPUInfo();
});