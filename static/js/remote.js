let pingInterval;
let metricsInterval;
let currentPath = "C:\\Users\\Administrator";

function showPanel(panelType) {
    // Tab butonlarını güncelle
    document.getElementById('metricsTab').classList.remove('active');
    document.getElementById('rdpTab').classList.remove('active');
    document.getElementById(panelType + 'Tab').classList.add('active');

    // Panelleri göster/gizle
    document.getElementById('metricsPanel').style.display = 'none';
    document.getElementById('rdpPanel').style.display = 'none';
    document.getElementById(panelType + 'Panel').style.display = 'block';
}

async function connectSystem() {
    const ipAddress = document.getElementById('ipAddress').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!ipAddress || !username || !password) {
        alert('Lütfen tüm bağlantı bilgilerini girin');
        return;
    }

    // RDP bilgilerini güncelle
    document.getElementById('rdpIp').textContent = ipAddress;
    document.getElementById('rdpUsername').textContent = username;
    document.getElementById('rdpPassword').textContent = password;

    // Sistem metriklerini yükle
    clearInterval(pingInterval);
    clearInterval(metricsInterval);

    try {
        const response = await fetch(`http://localhost:5000/ping/${ipAddress}`);
        if (response.ok) {
            document.getElementById('metricsPanel').style.display = 'block';
            loadMetrics();
            metricsInterval = setInterval(loadMetrics, 2000);
            pingInterval = setInterval(() => checkConnection(ipAddress), 5000);
        }
    } catch (error) {
        console.error('Bağlantı hatası:', error);
        alert('Bağlantı başarısız!');
    }
}

async function startRDP() {
    const ip = document.getElementById('ipAddress').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!ip || !username || !password) {
        alert('Lütfen tüm bağlantı bilgilerini doldurun');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/rdp-connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ip: ip,
                username: username,
                password: password
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Başarılı bağlantı
        alert('RDP bağlantısı başlatılıyor...');

    } catch (error) {
        console.error('RDP hatası:', error);
        alert('RDP bağlantısı başlatılamadı: ' + error.message);
    }
}

async function checkSystem() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const ipAddress = document.getElementById('ipAddress').value;
    
    if (!ipAddress) {
        alert('Lütfen bir IP adresi girin');
        return;
    }

    clearInterval(pingInterval);
    clearInterval(metricsInterval);

    try {
        const response = await fetch(`http://localhost:5000/ping/${ipAddress}`, {
            headers: {
                'Authorization': JSON.stringify(user)
            }
        });
        
        if (response.status === 403) {
            alert('Bu sayfaya erişim yetkiniz yok!');
            window.location.href = '/html/app.html';
            return;
        }

        const data = await response.json();
        
        const resultsDiv = document.getElementById('pingResults');
        const statusBadge = document.getElementById('statusBadge');
        const outputPre = document.getElementById('pingOutput');
        
        resultsDiv.style.display = 'block';
        
        if (data.success) {
            statusBadge.textContent = 'Çevrimiçi';
            statusBadge.className = 'status-badge status-online';
        } else {
            statusBadge.textContent = 'Çevrimdışı';
            statusBadge.className = 'status-badge status-offline';
        }
        
        outputPre.textContent = data.output;

        if (isLocalNetwork(ipAddress)) {
            document.getElementById('remoteMetrics').style.display = 'flex';
            updateRemoteMetrics(ipAddress);
            metricsInterval = setInterval(() => updateRemoteMetrics(ipAddress), 2000);
        }

    } catch (error) {
        console.error('Hata:', error);
        alert('Bir hata oluştu!');
    }
}

async function updateRemoteMetrics(ip) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    try {
        const response = await fetch(`http://localhost:5000/remote-metrics/${ip}`, {
            headers: {
                'Authorization': JSON.stringify(user)
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('remoteRamValue').textContent = `${data.ram.percent.toFixed(1)}%`;
            document.getElementById('remoteRamDetails').textContent = 
                `${formatBytes(data.ram.used)} / ${formatBytes(data.ram.total)}`;
            document.getElementById('remoteRamBar').style.width = `${data.ram.percent}%`;

            document.getElementById('remoteCpuValue').textContent = `${data.cpu.percent.toFixed(1)}%`;
            document.getElementById('remoteCpuDetails').textContent = 
                `${data.cpu.cores} çekirdek`;
            document.getElementById('remoteCpuBar').style.width = `${data.cpu.percent}%`;

            document.getElementById('remoteDiskValue').textContent = `${data.disk.percent.toFixed(1)}%`;
            document.getElementById('remoteDiskDetails').textContent = 
                `${formatBytes(data.disk.used)} / ${formatBytes(data.disk.total)}`;
            document.getElementById('remoteDiskBar').style.width = `${data.disk.percent}%`;
        }
    } catch (error) {
        console.error('Uzak sistem metrik hatası:', error);
    }
}

function isLocalNetwork(ip) {
    // Basit domain kontrolü - geliştirilebilir
    return ip.startsWith('192.168.') || ip.startsWith('10.') || ip === 'localhost';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 GB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Sayfa yüklendiğinde IP adresini al
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('http://localhost:5000/api/get-ip');
        const data = await response.json();
        if (data.ip) {
            document.getElementById('ipAddress').value = data.ip;
        }
    } catch (error) {
        console.error('IP adresi alınamadı:', error);
    }
});

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    showPanel('metrics');  // Varsayılan olarak metrikleri göster
});

async function startNetworkScan() {
    const ipAddress = document.getElementById('ipAddress').value;
    
    if (!ipAddress) {
        alert('Lütfen bir IP adresi girin');
        return;
    }

    const statusDiv = document.getElementById('currentStatus');
    const resultsTable = document.getElementById('scanResults');
    resultsTable.innerHTML = ''; // Tabloyu temizle
    
    try {
        const ws = new WebSocket('ws://localhost:5000/ws/scan');
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            
            if (data.type === 'status') {
                statusDiv.textContent = data.message;
                
                if (data.ip) {
                    let ipRow = document.getElementById(`ip-${data.ip}`);
                    
                    if (!ipRow) {
                        ipRow = document.createElement('tr');
                        ipRow.id = `ip-${data.ip}`;
                        resultsTable.appendChild(ipRow);
                    }

                    const responseTime = data.time ? parseInt(data.time) : 0;
                    const barWidth = Math.min((responseTime / 1000) * 100, 100);

                    ipRow.innerHTML = `
                        <td>${data.ip}</td>
                        <td class="${data.status.toLowerCase()}-host">${data.status}</td>
                        <td>${data.time || '-'}</td>
                        <td>
                            <div class="usage-bar">
                                <div class="usage-fill" style="width: ${data.status === 'Aktif' ? barWidth : 0}%"></div>
                            </div>
                        </td>
                    `;
                }
            }
        };

        ws.onopen = function() {
            statusDiv.textContent = 'Tarama başlatılıyor...';
            ws.send(JSON.stringify({
                ipAddress: ipAddress
            }));
        };

        ws.onerror = function(error) {
            throw new Error('WebSocket bağlantı hatası');
        };

    } catch (error) {
        console.error('Tarama hatası:', error);
        statusDiv.innerHTML = `<span style="color: red;">Hata: ${error.message}</span>`;
    }
}

async function sendSSHCommand() {
    const ip = document.getElementById('ipAddress').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const command = document.getElementById('sshCommand').value;
    const isSudo = document.getElementById('sudoCommand').checked;

    if (!command) {
        alert('Lütfen bir komut girin');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/ssh-connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ip: ip,
                username: username,
                password: password,
                command: command,
                is_sudo: isSudo
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Komut çıktısını terminal ekranına yaz
        document.getElementById('terminalOutput').innerHTML += 
            `<div class="command">${isSudo ? 'sudo ' : ''}${command}</div>` +
            `<div class="output">${data.output}</div>`;

        // Otomatik scroll
        const terminal = document.getElementById('terminalOutput');
        terminal.scrollTop = terminal.scrollHeight;

    } catch (error) {
        console.error('SSH hatası:', error);
        document.getElementById('terminalOutput').innerHTML += 
            `<div class="error">Hata: ${error.message}</div>`;
    }
}

document.getElementById('cmdCommand').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        executeCommand(this.value);
        this.value = '';
    }
});

async function executeCommand(command) {
    const terminal = document.getElementById('terminalOutput');
    const commandLine = `${currentPath}>${command}`;
    
    // Komutu terminale ekle
    appendToTerminal(commandLine, 'command-text');

    try {
        const response = await fetch('http://localhost:5000/api/execute-cmd', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                command: command,
                path: currentPath
            })
        });

        const data = await response.json();
        
        if (data.error) {
            appendToTerminal(data.error, 'error-text');
        } else {
            if (data.output) {
                appendToTerminal(data.output, 'success-text');
            }
            if (data.newPath) {
                currentPath = data.newPath;
                updatePrompt();
            }
        }
    } catch (error) {
        appendToTerminal(`Hata: ${error.message}`, 'error-text');
    }

    terminal.scrollTop = terminal.scrollHeight;
}

function appendToTerminal(text, className) {
    const terminal = document.getElementById('terminalOutput');
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.textContent = text;
    terminal.appendChild(line);
}

function updatePrompt() {
    const prompts = document.getElementsByClassName('prompt');
    for (let prompt of prompts) {
        prompt.textContent = `${currentPath}>`;
    }
}