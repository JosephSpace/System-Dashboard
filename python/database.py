import sqlite3
import hashlib
import json

def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    
    # Önce eski tabloyu sil
    c.execute('DROP TABLE IF EXISTS users')
    
    # Kullanıcılar tablosunu oluştur
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            settings TEXT NOT NULL
        )
    ''')
    
    # Örnek kullanıcıları ekle
    default_users = [
        {
            'username': 'admin',
            'password': 'admin',  # şifreyi admin olarak değiştirdik
            'full_name': 'Admin Kullanıcı',
            'role': 'admin',
            'settings': {
                'theme': 'light',
                'showAllProcesses': True,
                'refreshRate': 1000,
                'defaultSort': 'memory'
            }
        },
        {
            'username': 'user1',
            'password': 'user123',
            'full_name': 'Test Kullanıcı',
            'role': 'user',
            'settings': {
                'theme': 'dark',
                'showAllProcesses': False,
                'refreshRate': 2000,
                'defaultSort': 'cpu'
            }
        }
    ]
    
    for user in default_users:
        password_hash = hashlib.sha256(user['password'].encode()).hexdigest()
        settings_json = json.dumps(user['settings'])
        
        try:
            c.execute('''
                INSERT INTO users (username, password_hash, full_name, role, settings)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                user['username'],
                password_hash,
                user['full_name'],
                user['role'],
                settings_json
            ))
        except sqlite3.IntegrityError as e:
            print(f"Hata: {e} - Kullanıcı: {user['username']}")
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Veritabanı başarıyla oluşturuldu!") 