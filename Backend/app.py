from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import tempfile

app = Flask(__name__)
CORS(app)

@app.route('/run', methods=['POST'])
def run_code():
    data = request.get_json()
    lang = data.get('language')
    code = data.get('code')
    user_input = data.get('input', '')

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            if lang == 'python':
                file_path = os.path.join(temp_dir, 'main.py')
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(code)
                
                process = subprocess.run(
                    ['python', file_path],
                    input=user_input, text=True, capture_output=True, timeout=5
                )
                return jsonify({'stdout': process.stdout, 'stderr': process.stderr, 'code': process.returncode})

            elif lang == 'c++':
                file_path = os.path.join(temp_dir, 'main.cpp')
                exe_path = os.path.join(temp_dir, 'main.exe')
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(code)

                compile_process = subprocess.run(
                    ['g++', file_path, '-o', exe_path],
                    text=True, capture_output=True
                )
                
                if compile_process.returncode != 0:
                    return jsonify({'stdout': '', 'stderr': compile_process.stderr, 'code': compile_process.returncode})

                run_process = subprocess.run(
                    [exe_path],
                    input=user_input, text=True, capture_output=True, timeout=5
                )
                return jsonify({'stdout': run_process.stdout, 'stderr': run_process.stderr, 'code': run_process.returncode})

            elif lang == 'java':
                file_path = os.path.join(temp_dir, 'Main.java')
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(code)

                compile_process = subprocess.run(
                    ['javac', file_path],
                    text=True, capture_output=True
                )
                
                if compile_process.returncode != 0:
                    return jsonify({'stdout': '', 'stderr': compile_process.stderr, 'code': compile_process.returncode})

                run_process = subprocess.run(
                    ['java', '-cp', temp_dir, 'Main'],
                    input=user_input, text=True, capture_output=True, timeout=5
                )
                return jsonify({'stdout': run_process.stdout, 'stderr': run_process.stderr, 'code': run_process.returncode})

            else:
                return jsonify({'stdout': '', 'stderr': 'Ngôn ngữ chưa được hỗ trợ!', 'code': 1})

        except subprocess.TimeoutExpired:
            return jsonify({'stdout': '', 'stderr': 'Time Limit Exceeded (Quá 5 giây)!', 'code': 124})
        except Exception as e:
            return jsonify({'stdout': '', 'stderr': f'Lỗi server: {str(e)}', 'code': 1})

@app.route('/stress-test', methods=['POST'])
def run_stress_test():
    data = request.get_json()
    test_count = int(data.get('test_count', 100))
    time_limit_sec = int(data.get('time_limit', 1000)) / 1000.0
    
    # Lấy thông tin code và ngôn ngữ từ Frontend
    configs = {
        'gen': {'code': data.get('gen_code'), 'lang': data.get('gen_lang')},
        'brute': {'code': data.get('brute_code'), 'lang': data.get('brute_lang')},
        'opt': {'code': data.get('opt_code'), 'lang': data.get('opt_lang')}
    }

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # --- BƯỚC 1: CHUẨN BỊ FILE VÀ BIÊN DỊCH ---
            exec_cmds = {}

            for role, cfg in configs.items():
                lang = cfg['lang']
                code = cfg['code']
                
                # TẠO THƯ MỤC RIÊNG CHO TỪNG ROLE (gen, brute, opt)
                role_dir = os.path.join(temp_dir, role)
                os.makedirs(role_dir, exist_ok=True)
                
                if lang == 'python':
                    file_path = os.path.join(role_dir, f'{role}.py')
                    with open(file_path, 'w', encoding='utf-8') as f: f.write(code)
                    exec_cmds[role] = ['python', file_path]
                
                elif lang == 'cpp':
                    file_path = os.path.join(role_dir, f'{role}.cpp')
                    exe_path = os.path.join(role_dir, f'{role}.exe')
                    with open(file_path, 'w', encoding='utf-8') as f: f.write(code)
                    
                    comp = subprocess.run(['g++', file_path, '-o', exe_path], capture_output=True, text=True)
                    if comp.returncode != 0:
                        return jsonify({"verdict": "ERROR", "actual": f"Lỗi biên dịch {role}:\n{comp.stderr}"})
                    exec_cmds[role] = [exe_path]
                
                elif lang == 'java':
                    # Fix lỗi Java: Giữ nguyên tên Main.java, nằm gọn trong thư mục riêng
                    file_path = os.path.join(role_dir, 'Main.java')
                    with open(file_path, 'w', encoding='utf-8') as f: f.write(code)
                    
                    comp = subprocess.run(['javac', file_path], capture_output=True, text=True)
                    if comp.returncode != 0:
                        return jsonify({"verdict": "ERROR", "actual": f"Lỗi biên dịch {role} (Java):\n{comp.stderr}"})
                    # Gọi Java chạy class Main trong thư mục của nó
                    exec_cmds[role] = ['java', '-cp', role_dir, 'Main']

            # --- BƯỚC 2: VÒNG LẶP NATIVE ---
            for i in range(1, test_count + 1):
                gen_proc = subprocess.run(exec_cmds['gen'], capture_output=True, text=True, timeout=5)
                test_case = gen_proc.stdout.strip()

                brute_proc = subprocess.run(exec_cmds['brute'], input=test_case, capture_output=True, text=True, timeout=10)
                expected_out = brute_proc.stdout.strip()

                try:
                    opt_proc = subprocess.run(
                        exec_cmds['opt'], 
                        input=test_case, 
                        capture_output=True, 
                        text=True, 
                        timeout=time_limit_sec
                    )
                    
                    if opt_proc.returncode != 0:
                        return jsonify({"verdict": "RTE", "test": i, "input": test_case, "expected": expected_out, "actual": opt_proc.stderr or "Runtime Error"})
                    
                    actual_out = opt_proc.stdout.strip()
                    if actual_out != expected_out:
                        return jsonify({"verdict": "WA", "test": i, "input": test_case, "expected": expected_out, "actual": actual_out})
                        
                except subprocess.TimeoutExpired:
                    return jsonify({"verdict": "TLE", "test": i, "input": test_case, "expected": expected_out, "actual": f"Chương trình chạy quá {time_limit_sec}s"})

            return jsonify({"verdict": "AC", "passed": test_count})
            
        except Exception as e:
            return jsonify({"verdict": "ERROR", "actual": f"Lỗi hệ thống: {str(e)}"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)