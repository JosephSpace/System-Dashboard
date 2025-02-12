function updateNavbar() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const navLinks = document.querySelector('.nav-links');
    const navBrand = document.querySelector('.nav-brand');
    
    if (!user) {
        window.location.href = '/html/login.html';
        return;
    }

    // Sadece "Sistem Yönetimi" yazısını göster
    navBrand.textContent = "Sistem Yönetimi";

    // Role göre menüleri göster
    if (user.role === 'admin') {
        navLinks.innerHTML = `
            <a href="/html/app.html" class="nav-link">Sistem Monitör</a>
            <a href="/html/remote.html" class="nav-link">Uzak Sistem</a>
            <a href="/html/users.html" class="nav-link">Kullanıcı Kontrolü</a>
            <a href="/html/ssh.html" class="nav-link">SSH Terminal</a>
            <button onclick="logout()" class="nav-link logout-btn">Çıkış Yap</button>
        `;
    } else if (user.role === 'user') {
        navLinks.innerHTML = `
            <a href="/html/app.html" class="nav-link">Sistem Monitör</a>
            <a href="/html/remote.html" class="nav-link">Uzak Sistem</a>
            <button onclick="logout()" class="nav-link logout-btn">Çıkış Yap</button>
        `;
    } else if (user.role === 'test') {
        navLinks.innerHTML = `
            <a href="/html/app.html" class="nav-link">Sistem Monitör</a>
            <button onclick="logout()" class="nav-link logout-btn">Çıkış Yap</button>
        `;
    }
    
    // Aktif sayfanın linkini işaretle
    const currentPage = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // Yetkisiz sayfa erişimlerini engelle
    if (user.role === 'test' && 
        (currentPage.includes('remote.html') || currentPage.includes('ssh.html') || currentPage.includes('users.html'))) {
        window.location.href = '/html/app.html';
    } else if (user.role === 'user' && 
        (currentPage.includes('remote.html') || currentPage.includes('users.html'))) {
        window.location.href = '/html/app.html';
    }
}

// Her sayfanın başında yetki kontrolü yap
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = '/html/login.html';
        return;
    }

    // Eğer admin değilse ve yasak sayfadaysa ana sayfaya yönlendir
    const currentPage = window.location.pathname;
    if (user.role !== 'admin' && 
        (currentPage.includes('remote.html') || currentPage.includes('ssh.html'))) {
        window.location.href = '/html/app.html';
        return;
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
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
            <a href="/html/users.html" class="nav-link">Kullanıcı Kontrolü</a>
            <a href="/html/ssh.html" class="nav-link">SSH Terminal</a>
            <button onclick="logout()" class="nav-link logout-btn">Çıkış Yap</button>
        `;
    } else if (currentUser.role === 'user') {
        // Normal kullanıcı için sadece izinli sayfalar
        navLinks.innerHTML = `
            <a href="/html/app.html" class="nav-link">Sistem Monitör</a>
            <button onclick="logout()" class="nav-link logout-btn">Çıkış Yap</button>
        `;
    }

    // Aktif sayfayı işaretle
    const currentPage = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
});

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/html/login.html';
} 