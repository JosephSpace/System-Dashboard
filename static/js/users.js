async function loadUsers() {
    try {
        const response = await fetch('http://localhost:5000/api/users');
        if (!response.ok) {
            throw new Error('Kullanıcılar yüklenemedi');
        }
        const users = await response.json();
        
        const usersTableBody = document.getElementById('usersTableBody');
        
        if (users.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center;">Henüz kullanıcı bulunmuyor</td>
                </tr>`;
            return;
        }

        usersTableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>
                    <button onclick="changePassword('${user.username}')" class="action-btn edit-btn">Şifre Değiştir</button>
                    ${user.username !== 'admin' ? `
                        <button onclick="deleteUser('${user.username}')" 
                                class="delete-btn" 
                                ${user.username === 'admin' ? 'disabled' : ''}>
                            Sil
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Hata:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: red;">
                    Kullanıcılar yüklenirken hata oluştu
                </td>
            </tr>`;
    }
}

async function addUser() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    if (!username || !password) {
        alert('Kullanıcı adı ve şifre boş olamaz!');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                role: role
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Kullanıcı eklenemedi');
        }

        // Formu temizle
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('role').value = 'test';

        // Başarılı mesajı göster
        alert('Kullanıcı başarıyla eklendi');

        // Listeyi yenile
        await loadUsers();

    } catch (error) {
        console.error('Hata:', error);
        alert(error.message || 'Kullanıcı eklenirken bir hata oluştu');
    }
}

async function changePassword(username) {
    const newPassword = prompt(`${username} için yeni şifre girin:`);
    if (!newPassword) return;

    try {
        const response = await fetch(`http://localhost:5000/users/${username}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: newPassword })
        });

        if (response.ok) {
            alert('Şifre başarıyla değiştirildi!');
        } else {
            const error = await response.json();
            alert(error.error || 'Şifre değiştirilirken bir hata oluştu!');
        }
    } catch (error) {
        console.error('Şifre değiştirilirken hata:', error);
        alert('Bir hata oluştu!');
    }
}

async function deleteUser(username) {
    if (username === 'admin') {
        alert('Admin kullanıcısı silinemez!');
        return;
    }

    if (!confirm(`${username} kullanıcısını silmek istediğinizden emin misiniz?`)) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/users/${username}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Kullanıcı silinemedi');
        }

        // Başarılı mesajı göster
        alert('Kullanıcı başarıyla silindi');

        // Listeyi yenile
        await loadUsers();

    } catch (error) {
        console.error('Hata:', error);
        alert(error.message || 'Kullanıcı silinirken bir hata oluştu');
    }
}

async function deleteAllUsers() {
    if (!confirm('TÜM KULLANICILARI SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ?')) {
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/users', {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Kullanıcılar silinemedi');
        }

        // Başarılı mesajı göster
        alert('Tüm kullanıcılar başarıyla silindi');

        // Listeyi yenile
        await loadUsers();

    } catch (error) {
        console.error('Hata:', error);
        alert(error.message || 'Kullanıcılar silinirken bir hata oluştu');
    }
}

// Sayfa yüklendiğinde çalışacak
document.addEventListener('DOMContentLoaded', function() {
    checkUserAccess();
    loadUsers();
});

// Kullanıcı erişim kontrolü
function checkUserAccess() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = '/html/login.html';
        return;
    }

    // Navbar linklerini güncelle
    const navLinks = document.querySelector('.nav-links');
    
    if (currentUser.role === 'admin') {
        // Admin için tüm linkler
        navLinks.innerHTML = `
            <a href="/html/app.html" class="nav-link">Sistem Monitör</a>
            <a href="/html/remote.html" class="nav-link">Uzak Sistem</a>
            <a href="/html/users.html" class="nav-link active">Kullanıcı Kontrolü</a>
            <a href="/html/ssh.html" class="nav-link">SSH Terminal</a>
            <button onclick="logout()" class="nav-link logout-btn">Çıkış Yap</button>
        `;
    } else if (currentUser.role === 'user') {
        // Normal kullanıcı için kısıtlı linkler
        navLinks.innerHTML = `
            <a href="/html/app.html" class="nav-link">Sistem Monitör</a>
            <a href="/html/remote.html" class="nav-link">Uzak Sistem</a>
            <button onclick="logout()" class="nav-link logout-btn">Çıkış Yap</button>
        `;
        
        // Eğer kullanıcı yetkisi olmayan bir sayfadaysa ana sayfaya yönlendir
        const currentPage = window.location.pathname;
        if (currentPage.includes('users.html') || currentPage.includes('ssh.html')) {
            window.location.href = '/html/app.html';
        }
    }
}

// Çıkış yapma fonksiyonu
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/html/login.html';
}

document.querySelector('form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    addUser();
}); 