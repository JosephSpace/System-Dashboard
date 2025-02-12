import subprocess
import os

def execute_command(command):
    try:
        # Güvenlik kontrolleri
        if any(cmd in command.lower() for cmd in ['rm -rf', 'mkfs', 'dd']):
            return {'error': 'Bu komut güvenlik nedeniyle engellenmiştir.'}
        
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            return {'error': stderr}
        
        return {'output': stdout}
    
    except Exception as e:
        return {'error': str(e)} 