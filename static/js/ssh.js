let commandHistory = [];
let historyIndex = -1;

function initTerminal() {
    const terminal = document.getElementById('terminal');
    const commandInput = document.getElementById('commandInput');

    commandInput.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter') {
            const command = this.value.trim();
            if (command) {
                addToTerminal(`$ ${command}`);
                try {
                    const user = JSON.parse(localStorage.getItem('currentUser'));
                    const response = await fetch('http://localhost:5000/execute', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': JSON.stringify(user)
                        },
                        body: JSON.stringify({ command })
                    });
                    const data = await response.json();
                    
                    if (data.error) {
                        addToTerminal(data.error, 'error');
                    } else {
                        addToTerminal(data.output);
                    }
                } catch (error) {
                    addToTerminal('Bağlantı hatası: ' + error.message, 'error');
                }
                
                commandHistory.push(command);
                historyIndex = commandHistory.length;
                this.value = '';
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                this.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                this.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                this.value = '';
            }
        }
    });
}

function addToTerminal(text, className = '') {
    const terminal = document.getElementById('terminal');
    const div = document.createElement('div');
    div.textContent = text;
    div.className = className;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'admin') {
        window.location.href = '/html/app.html';
        return;
    }
    initTerminal();
    document.getElementById('commandInput').focus();
});