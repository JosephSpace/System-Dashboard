from flask import jsonify, request
from flask_cors import CORS
import json
import os

def init_app(app):
    CORS(app)  # CORS desteği ekle

USERS_FILE = 'data/users.json'

def init_users_file():
    if not os.path.exists('data'):
        os.makedirs('data')
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump([], f)

def load_users():
    try:
        init_users_file()
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Kullanıcılar yüklenirken hata: {str(e)}")
        return []

def save_users(users):
    try:
        init_users_file()
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=4)
        return True
    except Exception as e:
        print(f"Kullanıcılar kaydedilirken hata: {str(e)}")
        return False

# Kullanıcıları getir
def get_users():
    try:
        users = load_users()
        # Şifreleri gizle
        for user in users:
            user.pop('password', None)
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Yeni kullanıcı ekle
def add_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'test')  # Varsayılan rol: test

        if not username or not password:
            return jsonify({'error': 'Kullanıcı adı ve şifre gereklidir'}), 400

        users = load_users()
        
        # Kullanıcı adı kontrolü
        if any(user['username'] == username for user in users):
            return jsonify({'error': 'Bu kullanıcı adı zaten kullanılıyor'}), 400

        # Yeni kullanıcı ekle
        users.append({
            'username': username,
            'password': password,
            'role': role
        })

        if save_users(users):
            return jsonify({'message': 'Kullanıcı başarıyla eklendi'})
        else:
            return jsonify({'error': 'Kullanıcı kaydedilirken hata oluştu'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Kullanıcı sil
def delete_user(username):
    try:
        users = load_users()
        initial_length = len(users)
        users = [user for user in users if user['username'] != username]

        if len(users) == initial_length:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 404

        if save_users(users):
            return jsonify({'message': 'Kullanıcı başarıyla silindi'})
        else:
            return jsonify({'error': 'Kullanıcı silinirken hata oluştu'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Tüm kullanıcıları sil
def delete_all_users():
    try:
        if save_users([]):
            return jsonify({'message': 'Tüm kullanıcılar başarıyla silindi'})
        else:
            return jsonify({'error': 'Kullanıcılar silinirken hata oluştu'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500 