from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import subprocess
import tempfile

app = Flask(__name__)
CORS(app)

DEFAULT_TIMEOUT_SECONDS = 5
COMPILE_TIMEOUT_SECONDS = 15
SUPPORTED_LANGUAGES = {'cpp', 'python', 'java'}

def get_payload():
    return request.get_json(silent=True) or {}

def as_text(value):
    return value if isinstance(value, str) else ''

def parse_bounded_int(value, default, minimum=1, maximum=None):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default

    parsed = max(minimum, parsed)
    return min(parsed, maximum) if maximum else parsed

def normalize_language(value):
    if value in ('cpp', 'c++'):
        return 'cpp'
    if value in ('python', 'java'):
        return value
    return ''

def write_source(path, code):
    with open(path, 'w', encoding='utf-8') as source_file:
        source_file.write(code)

def run_subprocess(command, user_input='', timeout=DEFAULT_TIMEOUT_SECONDS):
    return subprocess.run(
        command,
        input=user_input,
        text=True,
        capture_output=True,
        timeout=timeout,
    )

def compile_subprocess(command):
    return subprocess.run(
        command,
        text=True,
        capture_output=True,
        timeout=COMPILE_TIMEOUT_SECONDS,
    )

def build_program(language, code, work_dir, stem='main'):
    if language not in SUPPORTED_LANGUAGES:
        return {'error': 'Ngôn ngữ chưa được hỗ trợ!', 'code': 1}

    if language == 'python':
        file_path = os.path.join(work_dir, f'{stem}.py')
        write_source(file_path, code)
        return {'command': ['python', file_path]}

    if language == 'cpp':
        file_path = os.path.join(work_dir, f'{stem}.cpp')
        exe_path = os.path.join(work_dir, f'{stem}.exe')
        write_source(file_path, code)

        compile_result = compile_subprocess(['g++', file_path, '-o', exe_path])
        if compile_result.returncode != 0:
            return {'error': compile_result.stderr, 'code': compile_result.returncode}

        return {'command': [exe_path]}

    file_path = os.path.join(work_dir, 'Main.java')
    write_source(file_path, code)

    compile_result = compile_subprocess(['javac', file_path])
    if compile_result.returncode != 0:
        return {'error': compile_result.stderr, 'code': compile_result.returncode}

    return {'command': ['java', '-cp', work_dir, 'Main']}

def run_single_program(language, code, user_input):
    with tempfile.TemporaryDirectory() as temp_dir:
        build = build_program(language, code, temp_dir)
        if build.get('error'):
            return {'stdout': '', 'stderr': build['error'], 'code': build.get('code', 1)}

        process = run_subprocess(build['command'], user_input)
        return {'stdout': process.stdout, 'stderr': process.stderr, 'code': process.returncode}

def build_stress_programs(configs, temp_dir):
    commands = {}

    for role, config in configs.items():
        language = normalize_language(config.get('lang'))
        code = as_text(config.get('code'))

        if not code.strip():
            return None, f'Thiếu code cho {role}.'

        role_dir = os.path.join(temp_dir, role)
        os.makedirs(role_dir, exist_ok=True)

        build = build_program(language, code, role_dir, role)
        if build.get('error'):
            return None, f'Lỗi biên dịch {role}:\n{build["error"]}'

        commands[role] = build['command']

    return commands, None

def stress_error(verdict, test=None, test_input='', expected='N/A', actual=''):
    payload = {'verdict': verdict, 'input': test_input, 'expected': expected, 'actual': actual}
    if test is not None:
        payload['test'] = test
    return payload

@app.route('/run', methods=['POST'])
def run_code():
    data = get_payload()
    language = normalize_language(data.get('language'))
    code = as_text(data.get('code'))
    user_input = as_text(data.get('input'))

    if not code.strip():
        return jsonify({'stdout': '', 'stderr': 'Vui lòng nhập code trước khi chạy!', 'code': 1})

    try:
        return jsonify(run_single_program(language, code, user_input))
    except subprocess.TimeoutExpired as error:
        timeout_value = error.timeout if error.timeout is not None else DEFAULT_TIMEOUT_SECONDS
        return jsonify({'stdout': '', 'stderr': f'Time Limit Exceeded (Quá {timeout_value}s)!', 'code': 124})
    except Exception as error:
        return jsonify({'stdout': '', 'stderr': f'Lỗi server: {str(error)}', 'code': 1})

@app.route('/stress-test', methods=['POST'])
def run_stress_test():
    data = get_payload()
    test_count = parse_bounded_int(data.get('test_count'), 100, minimum=1, maximum=1000)
    time_limit_ms = parse_bounded_int(data.get('time_limit'), 1000, minimum=100, maximum=10000)
    time_limit_sec = time_limit_ms / 1000.0

    configs = {
        'gen': {'code': data.get('gen_code'), 'lang': data.get('gen_lang')},
        'brute': {'code': data.get('brute_code'), 'lang': data.get('brute_lang')},
        'opt': {'code': data.get('opt_code'), 'lang': data.get('opt_lang')},
    }

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            commands, build_error = build_stress_programs(configs, temp_dir)
            if build_error:
                return jsonify({'verdict': 'ERROR', 'actual': build_error})

            for test_index in range(1, test_count + 1):
                try:
                    gen_proc = run_subprocess(commands['gen'], timeout=time_limit_sec)
                except subprocess.TimeoutExpired:
                    return jsonify(stress_error(
                        'TLE',
                        test_index,
                        'Quá hạn thời gian khi đang sinh test',
                        actual=f'Lỗi TLE: Generator chạy quá {time_limit_sec}s',
                    ))

                if gen_proc.returncode != 0:
                    return jsonify(stress_error(
                        'RTE',
                        test_index,
                        actual=gen_proc.stderr or 'Generator Runtime Error',
                    ))

                test_case = gen_proc.stdout

                try:
                    brute_proc = run_subprocess(commands['brute'], test_case, time_limit_sec)
                except subprocess.TimeoutExpired:
                    return jsonify(stress_error(
                        'TLE',
                        test_index,
                        test_case,
                        actual=f'Lỗi TLE: Code Thuật Trâu (Brute-force) chạy quá {time_limit_sec}s',
                    ))

                if brute_proc.returncode != 0:
                    return jsonify(stress_error(
                        'RTE',
                        test_index,
                        test_case,
                        actual=brute_proc.stderr or 'Brute-force Runtime Error',
                    ))

                expected_out = brute_proc.stdout.strip()

                try:
                    opt_proc = run_subprocess(commands['opt'], test_case, time_limit_sec)
                except subprocess.TimeoutExpired:
                    return jsonify(stress_error(
                        'TLE',
                        test_index,
                        test_case,
                        expected_out,
                        f'Lỗi TLE: Code Tối Ưu (Optimized) chạy quá {time_limit_sec}s',
                    ))

                if opt_proc.returncode != 0:
                    return jsonify(stress_error(
                        'RTE',
                        test_index,
                        test_case,
                        expected_out,
                        opt_proc.stderr or 'Runtime Error',
                    ))

                actual_out = opt_proc.stdout.strip()
                if actual_out != expected_out:
                    return jsonify(stress_error('WA', test_index, test_case, expected_out, actual_out))

            return jsonify({'verdict': 'AC', 'passed': test_count})

        except subprocess.TimeoutExpired as error:
            timeout_value = error.timeout if error.timeout is not None else COMPILE_TIMEOUT_SECONDS
            return jsonify({'verdict': 'ERROR', 'actual': f'Biên dịch quá thời gian ({timeout_value}s).'})
        except Exception as error:
            return jsonify({'verdict': 'ERROR', 'actual': f'Lỗi hệ thống: {str(error)}'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
