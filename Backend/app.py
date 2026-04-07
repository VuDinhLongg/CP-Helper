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

if __name__ == '__main__':
    app.run(debug=True, port=5000)