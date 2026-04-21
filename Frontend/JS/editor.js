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
        value: 'import random\n\n# Sinh ngẫu nhiên số N từ 1 đến 10^18\nprint(random.randint(1, 10**18))',
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false }
    });

    bruteEditor = monaco.editor.create(document.getElementById('editor-brute'), {
        value: '// Thuật trâu C++\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    long long n; cin >> n;\n    cout << n;\n    return 0;\n}',
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
async function fetchBackend(langCode, code, input, timeLimit = 1000) {
    let backendLang = "c++";
    if (langCode === 'python') backendLang = "python";
    if (langCode === 'java') backendLang = "java";

    const response = await fetch('http://127.0.0.1:5000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            language: backendLang, 
            code: code, 
            input: input,
            time_limit: timeLimit // Đã xóa memory_limit ở đây
        })
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
            outputConsole.textContent = "Lỗi biên dịch";
            outputConsole.style.color = "#e74c3c";
        } else {
            outputConsole.textContent = result.stdout;
            outputConsole.style.color = "#2ecc71"; 
        }
    } catch (error) {
        outputConsole.textContent = "Không gọi được Backend !";
        outputConsole.style.color = "#e74c3c"; 
    } finally {
        btnRun.innerHTML = '<i class="fa-solid fa-play"></i> Run';
        btnRun.disabled = false;
    }
}

// =========================================================
// --- 3. HÀM CHẠY STRESS TEST (SIÊU TỐC NATIVE)
// =========================================================

async function runStressTest() {
    const consoleOut = document.getElementById('stress-console');
    const btnRun = document.getElementById('btnRunStress');
    
    // 1. Thu thập dữ liệu từ giao diện
    let tmpTestCount = parseInt(document.getElementById('test-count').value) || 100;
    if (tmpTestCount > 1000){
        tmpTestCount = 1000;
        document.getElementById('test-count').value = 1000;
    }
    const testCount = tmpTestCount;
    const timeLimit = parseInt(document.getElementById('time-limit').value) || 1000;

    // 2. Thu thập ngôn ngữ
    const genLang = document.getElementById('lang-gen').value;
    const bruteLang = document.getElementById('lang-brute').value;
    const optLang = document.getElementById('lang-opt').value;

    // 3. Thu thập code (ĐÂY CHÍNH LÀ ĐOẠN BẠN BỊ THIẾU LÚC NÃY)
    const genCode = typeof genEditor !== 'undefined' ? genEditor.getValue() : '';
    const bruteCode = typeof bruteEditor !== 'undefined' ? bruteEditor.getValue() : '';
    const optCode = typeof optEditor !== 'undefined' ? optEditor.getValue() : '';

    // 4. Kiểm tra xem có ô nào bị bỏ trống không
    if (!genCode.trim() || !bruteCode.trim() || !optCode.trim()) {
        consoleOut.innerHTML = "<span style='color:#e74c3c'>Vui lòng nhập đầy đủ code cho cả 3 ô (Generator, Brute-force, Optimized)!</span>";
        return;
    }

    // 5. Khóa nút bấm và Hiển thị trạng thái đang chạy
    btnRun.disabled = true;
    btnRun.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
    consoleOut.innerHTML = `<span style="color:cyan;">Đang tạo ${testCount} bộ test và kiểm tra đầu ra...</span>`;

    try {
        // 6. Gửi API siêu tốc
        const response = await fetch('http://127.0.0.1:5000/stress-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                test_count: testCount,
                time_limit: timeLimit,
                gen_lang: genLang,       
                brute_lang: bruteLang,   
                opt_lang: optLang,       
                gen_code: genCode,
                brute_code: bruteCode,
                opt_code: optCode
            })
        });

        const result = await response.json();

        // 7. Xử lý và In kết quả 
        if (result.verdict === "AC") {
            consoleOut.innerHTML = `<span style="color:#2ecc71; font-size: 16px;"><b>Accepted! Đã vượt qua ${testCount} test(s)</b></span>`;
        } 
        else if (result.verdict === "ERROR") {
            consoleOut.innerHTML = `<span style="color:#e74c3c;">Lỗi Biên Dịch / Lỗi Hệ Thống:</span><br><pre style="color:#fff;">${result.actual}</pre>`;
        } 
        else {
            let verdictColor = "#e74c3c"; // Đỏ mặc định (WA, RTE)
            let verdictText = result.verdict === "WA" ? "Wrong Answer" : "Runtime Error";
            
            if (result.verdict === "TLE") {
                verdictColor = "#f39c12"; // Cam cho TLE
                verdictText = "Time Limit Exceeded";
            }

            consoleOut.innerHTML = 
                `<div style="margin-top: 10px; font-family: 'Inter', sans-serif; text-align: left; border-top: 1px dashed #444; padding-top: 12px;">` +
                    `<div style="margin-bottom: 8px; color: ${verdictColor}; font-size: 16px;">Test: #${result.test}, verdict: ${verdictText}</div>` +
                    `<div style="margin-bottom: 10px;">` +
                        `<div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2px;">` +
                            `<span style="font-weight: bold; font-size: 13px; color: #e0e0e0;">Input</span>` +
                            `<span onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText); this.innerText='Copied'; setTimeout(()=>this.innerText='Copy', 2000);" style="cursor: pointer; color: #aaa; font-size: 11px; border: 1px solid #555; padding: 1px 6px; border-radius: 3px; background: #252526; user-select: none;">Copy</span>` +
                        `</div>` +
                        `<pre style="margin: 0; padding: 8px; background-color: #1e1e1e; border: 1px solid #444; border-radius: 4px; color: #fff; font-family: 'Consolas', monospace; font-size: 13px; overflow-x: auto; white-space: pre;">${result.input}</pre>` +
                    `</div>` +
                    `<div style="margin-bottom: 10px;">` +
                        `<div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2px;">` +
                            `<span style="font-weight: bold; font-size: 13px; color: #e0e0e0;">Output</span>` +
                        `</div>` +
                        `<pre style="margin: 0; padding: 8px; background-color: #1e1e1e; border: 1px solid #444; border-radius: 4px; color: ${verdictColor}; font-family: 'Consolas', monospace; font-size: 13px; overflow-x: auto; white-space: pre;">${result.actual}</pre>` +
                    `</div>` +
                    `<div style="margin-bottom: 10px;">` +
                        `<div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2px;">` +
                            `<span style="font-weight: bold; font-size: 13px; color: #e0e0e0;">Answer</span>` +
                        `</div>` +
                        `<pre style="margin: 0; padding: 8px; background-color: #1e1e1e; border: 1px solid #444; border-radius: 4px; color: #fff; font-family: 'Consolas', monospace; font-size: 13px; overflow-x: auto; white-space: pre;">${result.expected}</pre>` +
                    `</div>` +
                `</div>`;
        }

    } catch (err) {
        consoleOut.innerHTML = `<span style="color:#e74c3c">Lỗi gọi Backend: ${err.message}</span>`;
    } finally {
        btnRun.disabled = false;
        btnRun.innerHTML = '<i class="fa-solid fa-play"></i> Run';
    }
}

