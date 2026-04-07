let mainEditor;
let genEditor;
let bruteEditor;
let optEditor;

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' } });

require(['vs/editor/editor.main'], function () {
    
    mainEditor = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}',
        language: 'cpp',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 15,
        minimap: { enabled: false }
    });

    genEditor = monaco.editor.create(document.getElementById('editor-gen'), {
        value: 'import random\n\n# Sinh ngẫu nhiên số N từ 1 đến 100\nprint(random.randint(1, 100))',
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false }
    });

    bruteEditor = monaco.editor.create(document.getElementById('editor-brute'), {
        value: '// Thuật trâu C++\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    cout << n;\n    return 0;\n}',
        language: 'cpp',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false }
    });

    optEditor = monaco.editor.create(document.getElementById('editor-opt'), {
        value: '// Thuật tối ưu C++\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    cout << n;\n    return 0;\n}',
        language: 'cpp',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false }
    });
});

function changeLanguage() {
    const lang = document.getElementById('lang-select').value;
    const fileName = document.getElementById('file-name');
    const langLabel = document.getElementById('lang-label');

    if (lang === 'cpp') {
        fileName.textContent = 'Main.cpp';
        langLabel.textContent = 'C++';
        langLabel.style.color = '#cccccc';
    } else if (lang === 'java') {
        fileName.textContent = 'Main.java';
        langLabel.textContent = 'Java';
        langLabel.style.color = '#cccccc';
    } else if (lang === 'python') {
        fileName.textContent = 'main.py';
        langLabel.textContent = 'Python';
        langLabel.style.color = '#cccccc';
    } 

    if (mainEditor) {
        monaco.editor.setModelLanguage(mainEditor.getModel(), lang);
        
        if (lang === 'cpp') {
            mainEditor.setValue('#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}');
        } else if (lang === 'java') {
            mainEditor.setValue('public class Main {\n    public static void main(String[] args) {\n        \n    }\n}');
        } else if (lang === 'python') {
            mainEditor.setValue('print("Hello Python!")');
        }
    }
}

// Hàm thay đổi ngôn ngữ cho từng khung Editor trong Test Generator
function changeTestLang(editorType) {
    // Đảm bảo thư viện monaco đã được tải xong
    if (typeof monaco !== 'undefined') {
        if (editorType === 'gen' && typeof genEditor !== 'undefined') {
            const lang = document.getElementById('lang-gen').value;
            monaco.editor.setModelLanguage(genEditor.getModel(), lang);
        } 
        else if (editorType === 'brute' && typeof bruteEditor !== 'undefined') {
            const lang = document.getElementById('lang-brute').value;
            monaco.editor.setModelLanguage(bruteEditor.getModel(), lang);
        } 
        else if (editorType === 'opt' && typeof optEditor !== 'undefined') {
            const lang = document.getElementById('lang-opt').value;
            monaco.editor.setModelLanguage(optEditor.getModel(), lang);
        }
    }
}

// =========================================================
// --- 1. HÀM GIAO TIẾP VỚI BACKEND (DÙNG CHUNG)
// =========================================================
async function fetchBackend(langCode, code, input) {
    let backendLang = "c++";
    if (langCode === 'python') backendLang = "python";
    if (langCode === 'java') backendLang = "java";

    const response = await fetch('http://127.0.0.1:5000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: backendLang, code: code, input: input })
    });
    return await response.json();
}

// =========================================================
// --- 2. HÀM CHẠY CODE CHO TAB "CODE EDITOR"
// =========================================================
async function runCode() {
    const langCode = document.getElementById('lang-select').value;
    const input = document.getElementById('user-input').value;
    const outputConsole = document.getElementById('output-console');
    const btnRun = document.getElementById('btnRun');
    const code = typeof mainEditor !== 'undefined' ? mainEditor.getValue() : '';

    if (!code.trim()) {
        outputConsole.textContent = "Vui lòng nhập code trước khi chạy!";
        outputConsole.style.color = "#e74c3c";
        return;
    }

    btnRun.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
    btnRun.disabled = true;
    outputConsole.textContent = "Đang biên dịch và chạy code...";
    outputConsole.style.color = "#cccccc";

    try {
        const result = await fetchBackend(langCode, code, input);
        if (result.code !== 0) {
            document.getElementById('modal-error-text').textContent = result.stderr || "Lỗi không xác định";
            document.getElementById('error-modal').style.display = 'flex';
            outputConsole.textContent = "Chương trình dính lỗi! Vui lòng xem chi tiết trên Pop-up.";
            outputConsole.style.color = "#e74c3c";
        } else {
            outputConsole.textContent = result.stdout;
            outputConsole.style.color = "#2ecc71"; 
        }
    } catch (error) {
        outputConsole.textContent = "Không gọi được Backend ! Hãy chắc chắn đã chạy 'python app.py'";
        outputConsole.style.color = "#e74c3c"; 
    } finally {
        btnRun.innerHTML = '<i class="fa-solid fa-play"></i> Run';
        btnRun.disabled = false;
    }
}

// =========================================================
// --- 3. HÀM CHẠY STRESS TEST CÓ NÚT DỪNG KHẨN CẤP
// =========================================================

let isStressTesting = false; // Công tắc kiểm soát vòng lặp

function stopStressTest() {
    isStressTesting = false; // Tắt công tắc
}

async function runStressTest() {
    const consoleOut = document.getElementById('stress-console');
    const btnRun = document.getElementById('btnRunStress');
    const btnStop = document.getElementById('btnStopStress');
    const testCount = parseInt(document.getElementById('test-count').value) || 100;

    const genCode = typeof genEditor !== 'undefined' ? genEditor.getValue() : '';
    const bruteCode = typeof bruteEditor !== 'undefined' ? bruteEditor.getValue() : '';
    const optCode = typeof optEditor !== 'undefined' ? optEditor.getValue() : '';

    const genLang = document.getElementById('lang-gen').value;
    const bruteLang = document.getElementById('lang-brute').value;
    const optLang = document.getElementById('lang-opt').value;

    if (!genCode.trim() || !bruteCode.trim() || !optCode.trim()) {
        consoleOut.textContent = "Vui lòng nhập đầy đủ code cho cả 3 ô (Generator, Brute-force, Optimized)!";
        consoleOut.style.color = "#e74c3c";
        return;
    }

    // --- BẬT CHẾ ĐỘ TESTING ---
    isStressTesting = true;
    btnRun.style.display = 'none';            // Giấu nút Run
    if (btnStop) btnStop.style.display = 'inline-block'; // Hiện nút Stop
    consoleOut.innerHTML = `<span style="color:#ccc">Bắt đầu Sinh test và Chấm đối chứng...</span><br>`;

    let allPassed = true;
    let stoppedByUser = false;

    for (let i = 1; i <= testCount; i++) {
        // KIỂM TRA CÔNG TẮC: Nếu user ấn Stop thì thoát vòng lặp ngay
        if (!isStressTesting) {
            stoppedByUser = true;
            consoleOut.innerHTML += `<br><br><span style="color:#f39c12; font-size: 15px;"><b>⚠️ ĐÃ DỪNG STRESS TEST (Chạy được ${i-1}/${testCount} test).</b></span>`;
            break;
        }

        try {
            // 1. Chạy Generator
            const genRes = await fetchBackend(genLang, genCode, "");
            if (genRes.code !== 0) {
                consoleOut.innerHTML += `<br><span style="color:#e74c3c"><b>Lỗi ở Generator (Test ${i}):</b></span><br>${genRes.stderr}`;
                allPassed = false; break;
            }
            const testCase = genRes.stdout;

            // 2. Chạy Brute-force
            const bruteRes = await fetchBackend(bruteLang, bruteCode, testCase);
            if (bruteRes.code !== 0) {
                consoleOut.innerHTML += `<br><span style="color:#e74c3c"><b>Lỗi ở Brute-force (Test ${i}):</b></span><br>${bruteRes.stderr}<br><br><b>Test Case gây lỗi:</b><br>${testCase}`;
                allPassed = false; break;
            }
            const expectedOut = bruteRes.stdout.trim();

            // 3. Chạy Optimized
            const optRes = await fetchBackend(optLang, optCode, testCase);
            if (optRes.code !== 0) {
                consoleOut.innerHTML += `<br><span style="color:#e74c3c"><b>Lỗi ở Optimized (Test ${i}):</b></span><br>${optRes.stderr}<br><br><b>Test Case gây lỗi:</b><br>${testCase}`;
                allPassed = false; break;
            }
            const actualOut = optRes.stdout.trim();

            // 4. So Sánh
            if (expectedOut !== actualOut) {
                consoleOut.innerHTML += `
                    <br><br><span style="color:#e74c3c; font-size: 16px;"><b>❌ WRONG ANSWER TẠI TEST ${i}</b></span><br><br>
                    <span style="color:cyan"><b>[Input (Test Case)]</b></span><br><pre style="color:#fff">${testCase}</pre><br>
                    <span style="color:#2ecc71"><b>[Expected (Brute-force)]</b></span><br><pre style="color:#fff">${expectedOut}</pre><br>
                    <span style="color:yellow"><b>[Actual (Optimized)]</b></span><br><pre style="color:#fff">${actualOut}</pre>
                `;
                allPassed = false; 
                break; 
            } else {
                // Tối ưu UI: Chỉ in đè 1 dòng duy nhất để Console không bị trôi tuột đi khi chạy 1000 test
                consoleOut.innerHTML = `<span style="color:#ccc">Bắt đầu Sinh test và Chấm đối chứng...</span><br><br><span style="color:#2ecc71"><b>✅ Đang chạy... Vượt qua Test ${i} / ${testCount}</b></span>`;
            }

        } catch (err) {
            consoleOut.innerHTML += `<br><span style="color:#e74c3c">Lỗi kết nối Backend: ${err.message}</span>`;
            allPassed = false; 
            break;
        }
    }

    if (allPassed && !stoppedByUser) {
        consoleOut.innerHTML = `<span style="color:#2ecc71; font-size: 16px;"><b>🎉 THÀNH CÔNG! ĐÃ VƯỢT QUA TẤT CẢ ${testCount} TEST CASES!</b></span>`;
    }

    // --- TẮT CHẾ ĐỘ TESTING, TRẢ LẠI GIAO DIỆN ---
    isStressTesting = false;
    btnRun.style.display = 'inline-block';    // Hiện lại nút Run
    if (btnStop) btnStop.style.display = 'none'; // Giấu nút Stop
}

