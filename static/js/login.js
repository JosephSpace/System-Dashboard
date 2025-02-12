document.addEventListener('DOMContentLoaded', function() {
    // Mevcut kullanıcı kontrolü
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = '/html/app.html';
    }

    // Login form işlemi
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        await login();
    });
});

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Lütfen kullanıcı adı ve şifre girin!');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (data.error) {
            alert('Hata: ' + data.error);
            return;
        }

        // Giriş başarılı
        localStorage.setItem('currentUser', JSON.stringify({
            username: data.username,
            role: data.role
        }));

        // Ana sayfaya yönlendir (app.html'e yönlendirin)
        window.location.href = '/html/app.html';

    } catch (error) {
        console.error('Giriş hatası:', error);
        alert('Giriş yapılırken bir hata oluştu!');
    }
}