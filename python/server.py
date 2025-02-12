from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import psutil
import sqlite3
import hashlib
import json
import os
import subprocess
from ssh_handler import execute_command
from users import get_users, add_user, delete_user, delete_all_users
import socket
import platform
import ipaddress
from flask_sock import Sock
import asyncio
import paramiko
import cpuinfo  # pip install py-cpuinfo

app = Flask(__name__, static_folder='../static')
CORS(app)
sock = Sock(app)

USERS_FILE = 'users.json'

# Kullanıcıları sıfırlama fonksiyonu kaldırıldı
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

@app.route('/')
def index():
    return send_from_directory('../static/html', 'login.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('../static', filename)

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        users = load_users()  # Kullanıcıları yükle

        # Kullanıcıyı bul
        user = next((u for u in users if u['username'] == username and u['password'] == password), None)
        
        if user:
            return jsonify({
                'message': 'Giriş başarılı',
                'username': username,
                'role': user['role']
            })
        else:
            return jsonify({'error': 'Geçersiz kullanıcı adı veya şifre'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/system-info')
def get_system_info():
    ram = psutil.virtual_memory()
    cpu_percent = psutil.cpu_percent(interval=1)
    disk = psutil.disk_usage('/')
    
    return jsonify({
        'ram': {
            'total': ram.total,
            'used': ram.used,
            'free': ram.free,
            'percent': ram.percent
        },
        'cpu': {
            'percent': cpu_percent,
            'cores': psutil.cpu_count()
        },
        'disk': {
            'total': disk.total,
            'used': disk.used,
            'free': disk.free,
            'percent': disk.percent
        }
    })

@app.route('/processes')
def get_processes():
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'memory_percent', 'cpu_percent']):
        try:
            process_info = proc.info
            memory_mb = (process_info['memory_percent'] / 100.0) * psutil.virtual_memory().total / (1024 * 1024)
            processes.append({
                'name': process_info['name'],
                'pid': process_info['pid'],
                'memory': f'{memory_mb:.1f} MB',
                'memory_percent': process_info['memory_percent'],
                'cpu': f'{process_info["cpu_percent"]:.1f}%'
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    return jsonify(processes)

@app.route('/execute', methods=['POST'])
def execute_command():
    try:
        data = request.get_json()
        command = data.get('command')

        # Windows'ta cmd.exe ile komutları çalıştır
        process = subprocess.run(
            f'cmd.exe /c {command}',
            capture_output=True,
            text=True,
            shell=True,
            cwd=os.getcwd()
        )

        # Hem stdout hem de stderr'i kontrol et
        output = process.stdout
        error = process.stderr

        if error:
            return jsonify({'error': error})
        elif output:
            return jsonify({'output': output})
        else:
            return jsonify({'output': 'Komut çalıştırıldı.'})

    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/ping/<ip>')
def ping_host(ip):
    try:
        output = subprocess.check_output(['ping', '-n', '4', ip], 
                                      stderr=subprocess.STDOUT,
                                      text=True)
        return jsonify({
            'success': True,
            'output': output
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            'success': False,
            'output': e.output
        })

@app.route('/api/users', methods=['GET'])
def get_users():
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        users = json.load(f)
        return jsonify(users)

@app.route('/api/users', methods=['POST'])
def add_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'user')

        if not username or not password:
            return jsonify({'error': 'Kullanıcı adı ve şifre gereklidir'}), 400

        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            users = json.load(f)

        # Kullanıcı adı kontrolü
        if any(user['username'] == username for user in users):
            return jsonify({'error': 'Bu kullanıcı adı zaten kullanılıyor'}), 400

        # Yeni kullanıcı ekle
        users.append({
            'username': username,
            'password': password,  # Gerçek uygulamada şifreyi hashleyin!
            'role': role
        })

        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=4, ensure_ascii=False)
        return jsonify({'message': 'Kullanıcı başarıyla eklendi'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<username>', methods=['DELETE'])
def delete_user(username):
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            users = json.load(f)
        users = [user for user in users if user['username'] != username]
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=4, ensure_ascii=False)
        return jsonify({'message': 'Kullanıcı başarıyla silindi'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['DELETE'])
def delete_all_users():
    try:
        with open(USERS_FILE, 'r') as f:
            users = json.load(f)

        # Sadece admin kullanıcısını tut
        users = [user for user in users if user['username'] == 'admin']

        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=4)

        return jsonify({'message': 'Tüm kullanıcılar silindi'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-ip', methods=['GET'])
def get_ip():
    try:
        hostname = socket.gethostname()
        ip_address = socket.gethostbyname(hostname)
        return jsonify({'ip': ip_address})
    except Exception as e:
        print(f"IP alma hatası: {str(e)}")
        return jsonify({'error': str(e)}), 500

@sock.route('/ws/scan')
def scan_network(ws):
    data = json.loads(ws.receive())
    ip_input = data['ipAddress']

    try:
        # CIDR formatını kontrol et
        if '/' in ip_input:
            network = ipaddress.ip_network(ip_input, strict=False)
            ip_list = list(network.hosts())
        else:
            # Tek IP adresi
            ip_list = [ipaddress.ip_address(ip_input)]

        total_ips = len(ip_list)

        for index, ip in enumerate(ip_list):
            ip_str = str(ip)
            progress = ((index + 1) / total_ips) * 100
            
            # Anlık durumu gönder
            ws.send(json.dumps({
                'type': 'status',
                'ip': ip_str,
                'status': 'Taranıyor',
                'progress': progress,
                'message': f'IP taranıyor: {ip_str}'
            }))

            # Ping kontrolü
            param = '-n' if platform.system().lower() == 'windows' else '-c'
            command = ['ping', param, '1', ip_str]
            
            try:
                output = subprocess.check_output(command, stderr=subprocess.STDOUT, universal_newlines=True)
                if 'TTL=' in output or 'ttl=' in output:
                    time = output.split('time=')[1].split('ms')[0].strip() if 'time=' in output else '0'
                    ws.send(json.dumps({
                        'type': 'status',
                        'ip': ip_str,
                        'status': 'Aktif',
                        'time': f'{time} ms',
                        'progress': progress,
                        'message': f'Aktif cihaz bulundu: {ip_str}'
                    }))
                else:
                    ws.send(json.dumps({
                        'type': 'status',
                        'ip': ip_str,
                        'status': 'Pasif',
                        'progress': progress,
                        'message': f'Cihaz yanıt vermiyor: {ip_str}'
                    }))
            except:
                ws.send(json.dumps({
                    'type': 'status',
                    'ip': ip_str,
                    'status': 'Pasif',
                    'progress': progress,
                    'message': f'Cihaz yanıt vermiyor: {ip_str}'
                }))

        ws.send(json.dumps({
            'type': 'status',
            'message': 'Tarama tamamlandı',
            'progress': 100
        }))

    except Exception as e:
        ws.send(json.dumps({
            'type': 'status',
            'message': f'Hata: {str(e)}',
            'progress': 0
        }))

@app.route('/api/rdp-connect', methods=['POST'])
def rdp_connect():
    try:
        data = request.get_json()
        ip = data.get('ip')
        username = data.get('username')
        password = data.get('password')

        if platform.system().lower() == 'windows':
            # Windows için mstsc.exe kullan
            rdp_command = f'cmdkey /generic:"{ip}" /user:"{username}" /pass:"{password}" && mstsc /v:{ip}'
            subprocess.Popen(rdp_command, shell=True)
            return jsonify({'message': 'RDP bağlantısı başlatıldı'})
        else:
            # Linux için xfreerdp kullan
            rdp_command = f'xfreerdp /v:{ip} /u:{username} /p:{password} /cert-ignore'
            subprocess.Popen(rdp_command.split())
            return jsonify({'message': 'RDP bağlantısı başlatıldı'})

    except Exception as e:
        print(f"RDP Hatası: {str(e)}")
        return jsonify({'error': 'RDP bağlantısı başlatılamadı: ' + str(e)}), 500

@app.route('/api/ssh-connect', methods=['POST'])
def ssh_connect():
    try:
        data = request.get_json()
        ip = data.get('ip')
        username = data.get('username')
        password = data.get('password')
        command = data.get('command')
        is_sudo = data.get('is_sudo', False)  # Sudo kullanımı için flag

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password)
        
        if is_sudo:
            # Sudo komutu için
            command = f'echo {password} | sudo -S {command}'
        
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        ssh.close()
        
        if error and 'password for' not in error:  # Sudo password prompt'unu yoksay
            return jsonify({'error': error}), 400
            
        return jsonify({'output': output})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cpu-info', methods=['GET'])
def get_cpu_info():
    try:
        # CPU bilgisini al
        cpu_info = cpuinfo.get_cpu_info()
        cpu_model = cpu_info['brand_raw']  # CPU modeli
        cpu_cores = os.cpu_count()  # CPU çekirdek sayısı
        
        return jsonify({
            'model': cpu_model,
            'cores': cpu_cores
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-current-path', methods=['GET'])
def get_current_path():
    try:
        # Windows'ta current directory'yi al
        process = subprocess.run('cd', capture_output=True, text=True, shell=True)
        return jsonify({'path': process.stdout.strip()})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/users/<username>/password', methods=['PUT'])
def change_password(username):
    try:
        data = request.get_json()
        new_password = data.get('newPassword')

        if not new_password:
            return jsonify({'error': 'Yeni şifre gereklidir'}), 400

        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            users = json.load(f)
            user_found = False

            for user in users:
                if user['username'] == username:
                    user['password'] = new_password  # Gerçek uygulamada şifreyi hashleyin!
                    user_found = True
                    break

            if not user_found:
                return jsonify({'error': 'Kullanıcı bulunamadı'}), 404

            with open(USERS_FILE, 'w', encoding='utf-8') as f:
                json.dump(users, f, indent=4, ensure_ascii=False)
            return jsonify({'message': 'Şifre başarıyla değiştirildi'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/html/app.html')
def app_page():
    return send_from_directory('../static/html', 'app.html')

@app.route('/api/network-scan', methods=['POST'])
def network_scan():
    try:
        data = request.get_json()
        ip_range = data.get('ip_range')  # Örneğin: "192.168.1.0/24"

        # Ağ taraması komutu
        command = ['nmap', '-sn', ip_range]  # Ping taraması yapıyoruz
        result = subprocess.run(command, capture_output=True, text=True, shell=True)

        # Aktif ve pasif ağları ayırmak için çıktı analizi
        output_lines = result.stdout.splitlines()
        active_hosts = []
        passive_hosts = []

        for line in output_lines:
            if "Nmap scan report for" in line:
                ip_address = line.split(" ")[-1]  # IP adresini al
                active_hosts.append(ip_address)
            elif "Host is up" in line:
                ip_address = line.split(" ")[-1]  # IP adresini al
                passive_hosts.append(ip_address)

        # Aktif ve pasif IP'leri birleştir
        all_hosts = list(set(active_hosts + passive_hosts))

        return jsonify({
            'active_hosts': all_hosts,
            'error': result.stderr
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Server başlatıldığında
if __name__ == '__main__':
    print("Server başlatılıyor...")
    app.run(debug=True) 