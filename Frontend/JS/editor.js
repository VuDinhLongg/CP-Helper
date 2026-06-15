let mainEditor;
let genEditor;
let bruteEditor;
let optEditor;

const API_BASE_URL = 'http://127.0.0.1:5000';
const MONACO_CDN_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs';

const DEFAULT_MAIN_CPP_CODE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);

    return 0;
}`;

const DEFAULT_MAIN_JAVA_CODE = `public class Main {
    public static void main(String[] args) {

    }
}`;

const DEFAULT_MAIN_PYTHON_CODE = `print("Hello Python!")`;

const DEFAULT_GENERATOR_CODE = `#include <bits/stdc++.h>
using namespace std;

#define int long long

mt19937_64 rd(time(0));
inline int rand(int l, int r){
    if(l > r) swap(l, r);
    return l + rd() % (r - l + 1);
}

signed main(){
    ios::sync_with_stdio(false); cin.tie(nullptr);

    int n = rand(1, 1e18);
    cout << n;

    return 0;
}`;

const DEFAULT_BRUTE_CODE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);

    long long n; cin >> n;
    cout << n;
    return 0;
}`;

const DEFAULT_OPT_CODE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);

    int n; cin >> n;
    cout << n;
    return 0;
}`;

const MAIN_LANGUAGE_CONFIG = {
    cpp: { fileName: 'Main.cpp', label: 'C++', template: DEFAULT_MAIN_CPP_CODE, monacoLanguage: 'cpp' },
    java: { fileName: 'Main.java', label: 'Java', template: DEFAULT_MAIN_JAVA_CODE, monacoLanguage: 'java' },
    python: { fileName: 'main.py', label: 'Python', template: DEFAULT_MAIN_PYTHON_CODE, monacoLanguage: 'python' },
};

const STRESS_EDITOR_CONFIG = {
    gen: { selectId: 'lang-gen' },
    brute: { selectId: 'lang-brute' },
    opt: { selectId: 'lang-opt' },
};

let editorsAreFallback = false;


function getGlobalValue(name) {
    return /** @type {any} */ (window)[name];
}


function setGlobalValue(name, value) {
    /** @type {any} */ (window)[name] = value;
}


function getMonacoApi() {
    return getGlobalValue('monaco');
}


function getMonacoLoader() {
    return getGlobalValue('require');
}


function getCurrentAppTheme() {
    const getTheme = getGlobalValue('getStoredTheme');
    return typeof getTheme === 'function' ? getTheme() : 'dark';
}


function refreshEditorsSoon(delay = 50) {
    if (typeof refreshEditorsLayout === 'function') {
        setTimeout(refreshEditorsLayout, delay);
    }
}


function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[char]);
}


function readBoundedIntegerInput(inputId, fallback, min, max) {
    const input = document.getElementById(inputId);
    let value = Number.parseInt(input?.value, 10);

    if (!Number.isFinite(value)) {
        value = fallback;
    }

    value = Math.min(max, Math.max(min, value));
    if (input) {
        input.value = String(value);
    }

    return value;
}


function createFallbackEditor(containerId, initialValue = '') {
    const container = document.getElementById(containerId);
    if (!container) return null;

    container.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.className = 'cp-fallback-editor form-control bg-dark text-light font-monospace';
    textarea.style.height = '100%';
    textarea.style.width = '100%';
    textarea.style.resize = 'none';
    textarea.value = initialValue;
    container.appendChild(textarea);

    return {
        getValue: () => textarea.value,
        setValue: (value) => { textarea.value = value; },
        layout: () => {},
        __fallback_true: true,
    };
}


function createFallbackEditors() {
    if (editorsAreFallback) return;

    editorsAreFallback = true;
    mainEditor = createFallbackEditor('monaco-editor', DEFAULT_MAIN_CPP_CODE);
    genEditor = createFallbackEditor('editor-gen', DEFAULT_GENERATOR_CODE);
    bruteEditor = createFallbackEditor('editor-brute', DEFAULT_BRUTE_CODE);
    optEditor = createFallbackEditor('editor-opt', DEFAULT_OPT_CODE);
    refreshEditorsSoon();
}


function getEditorThemeName(theme) {
    return theme === 'warm' ? 'cp-warm' : 'vs-dark';
}


function defineCustomEditorThemes() {
    const monacoApi = getMonacoApi();
    if (!monacoApi || getGlobalValue('cpWarmEditorThemeDefined')) return;

    monacoApi.editor.defineTheme('cp-warm', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: '', foreground: '3a3025', background: 'fff8e1' },
            { token: 'comment', foreground: '8a6f43', fontStyle: 'italic' },
            { token: 'keyword', foreground: '8b4c9c', fontStyle: 'bold' },
            { token: 'number', foreground: '0b7285' },
            { token: 'string', foreground: '287a3e' },
            { token: 'type', foreground: 'a55a00' },
        ],
        colors: {
            'editor.background': '#fff8e1',
            'editor.foreground': '#3a3025',
            'editorLineNumber.foreground': '#9b8150',
            'editorLineNumber.activeForeground': '#5f471f',
            'editorCursor.foreground': '#7c4a03',
            'editor.selectionBackground': '#ead08a',
            'editor.inactiveSelectionBackground': '#f1dfad',
            'editor.lineHighlightBackground': '#f5e7bd',
            'editorIndentGuide.background': '#e1c990',
            'editorIndentGuide.activeBackground': '#c9a75d',
        },
    });

    setGlobalValue('cpWarmEditorThemeDefined', true);
}


function applyEditorTheme(theme) {
    const monacoApi = getMonacoApi();
    if (!monacoApi) return;

    defineCustomEditorThemes();
    monacoApi.editor.setTheme(getEditorThemeName(theme));
}


function setMonacoModelLanguage(editor, language) {
    const monacoApi = getMonacoApi();
    if (!monacoApi || !editor || typeof editor.getModel !== 'function') return;

    const model = editor.getModel();
    if (model) {
        monacoApi.editor.setModelLanguage(model, language);
    }
}


function createMonacoEditor(containerId, value, language, fontSize) {
    const monacoApi = getMonacoApi();
    return monacoApi.editor.create(document.getElementById(containerId), {
        value,
        language,
        theme: getEditorThemeName(getCurrentAppTheme()),
        automaticLayout: true,
        fontSize,
        minimap: { enabled: false },
    });
}


function initializeMonacoEditors() {
    const monacoApi = getMonacoApi();
    if (!monacoApi || editorsAreFallback) {
        createFallbackEditors();
        return;
    }

    try {
        defineCustomEditorThemes();
        mainEditor = createMonacoEditor('monaco-editor', DEFAULT_MAIN_CPP_CODE, 'cpp', 15);
        genEditor = createMonacoEditor('editor-gen', DEFAULT_GENERATOR_CODE, 'cpp', 14);
        bruteEditor = createMonacoEditor('editor-brute', DEFAULT_BRUTE_CODE, 'cpp', 14);
        optEditor = createMonacoEditor('editor-opt', DEFAULT_OPT_CODE, 'cpp', 14);
        applyEditorTheme(getCurrentAppTheme());
        refreshEditorsSoon();
    } catch (error) {
        console.error('Error initializing Monaco editors:', error);
        createFallbackEditors();
    }
}


function ensureEditorFallback() {
    if (!mainEditor || typeof mainEditor.getValue !== 'function') {
        console.warn('Monaco editors unavailable; using fallback textareas');
        createFallbackEditors();
    }
}


function configureMonacoLoader() {
    const monacoLoader = getMonacoLoader();
    if (typeof monacoLoader !== 'function') {
        createFallbackEditors();
        return;
    }

    if (typeof monacoLoader.config === 'function') {
        monacoLoader.config({ paths: { vs: MONACO_CDN_PATH } });
    }

    monacoLoader(['vs/editor/editor.main'], initializeMonacoEditors);
    setTimeout(ensureEditorFallback, 1500);
}


function changeLanguage() {
    const lang = document.getElementById('lang-select')?.value;
    const config = MAIN_LANGUAGE_CONFIG[lang] || MAIN_LANGUAGE_CONFIG.cpp;
    const fileName = document.getElementById('file-name');
    const langLabel = document.getElementById('lang-label');

    if (fileName) fileName.textContent = config.fileName;
    if (langLabel) {
        langLabel.textContent = config.label;
        langLabel.style.color = '#cccccc';
    }

    if (mainEditor && typeof mainEditor.setValue === 'function') {
        setMonacoModelLanguage(mainEditor, config.monacoLanguage);
        mainEditor.setValue(config.template);
    }
}


function changeTestLang(editorType) {
    const config = STRESS_EDITOR_CONFIG[editorType];
    if (!config) return;

    const editors = { gen: genEditor, brute: bruteEditor, opt: optEditor };
    const editor = editors[editorType];
    const language = document.getElementById(config.selectId)?.value;
    setMonacoModelLanguage(editor, language);
}


async function postJson(endpoint, payload) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Backend trả về HTTP ${response.status}`);
    }

    return response.json();
}


async function fetchBackend(langCode, code, input, timeLimit = 1000) {
    return postJson('/run', {
        language: langCode,
        code,
        input,
        time_limit: timeLimit,
    });
}


function showRunError(stderr) {
    const modalText = document.getElementById('modal-error-text');
    if (modalText) {
        modalText.textContent = stderr || 'Lỗi không xác định';
    }
    showErrorModal();
}


async function runCode() {
    const langCode = document.getElementById('lang-select')?.value || 'cpp';
    const input = document.getElementById('user-input')?.value || '';
    const outputConsole = document.getElementById('output-console');
    const btnRun = document.getElementById('btnRun');
    const code = mainEditor && typeof mainEditor.getValue === 'function' ? mainEditor.getValue() : '';

    if (!outputConsole || !btnRun) return;

    if (!code.trim()) {
        outputConsole.textContent = 'Vui lòng nhập code trước khi chạy!';
        outputConsole.style.color = '#e74c3c';
        return;
    }

    btnRun.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
    btnRun.disabled = true;
    outputConsole.textContent = 'Đang biên dịch và chạy code...';
    outputConsole.style.color = '#cccccc';

    try {
        const result = await fetchBackend(langCode, code, input);
        if (result.code !== 0) {
            showRunError(result.stderr);
            outputConsole.textContent = 'Lỗi biên dịch';
            outputConsole.style.color = '#e74c3c';
            return;
        }

        outputConsole.textContent = result.stdout;
        outputConsole.style.color = '#2ecc71';
    } catch (error) {
        outputConsole.textContent = 'Không gọi được Backend!';
        outputConsole.style.color = '#e74c3c';
    } finally {
        btnRun.innerHTML = '<i class="fa-solid fa-play"></i> Run';
        btnRun.disabled = false;
    }
}


function getStressPayload() {
    return {
        test_count: readBoundedIntegerInput('test-count', 100, 1, 1000),
        time_limit: readBoundedIntegerInput('time-limit', 1000, 100, 10000),
        gen_lang: document.getElementById('lang-gen')?.value || 'cpp',
        brute_lang: document.getElementById('lang-brute')?.value || 'cpp',
        opt_lang: document.getElementById('lang-opt')?.value || 'cpp',
        gen_code: genEditor && typeof genEditor.getValue === 'function' ? genEditor.getValue() : '',
        brute_code: bruteEditor && typeof bruteEditor.getValue === 'function' ? bruteEditor.getValue() : '',
        opt_code: optEditor && typeof optEditor.getValue === 'function' ? optEditor.getValue() : '',
    };
}


function renderStressFailure(result) {
    let verdictClass = 'text-danger';
    let verdictText = result.verdict === 'WA' ? 'Wrong Answer' : 'Runtime Error';

    if (result.verdict === 'TLE') {
        verdictClass = 'text-warning';
        verdictText = 'Time Limit Exceeded';
    }

    return (
        `<div class="mt-2 pt-3 text-start border-top border-secondary">` +
            `<div class="${verdictClass} fs-6 mb-2">Test: #${escapeHtml(result.test)}, verdict: ${verdictText}</div>` +
            `<div class="mb-2">` +
                `<div class="d-flex justify-content-between align-items-end mb-1">` +
                    `<span class="fw-bold small text-light">Input</span>` +
                    `<button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2 cp-copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText); this.innerText='Copied'; setTimeout(()=>this.innerText='Copy', 2000);">Copy</button>` +
                `</div>` +
                `<pre class="cp-result-pre m-0 p-2 bg-dark border border-secondary rounded-1 text-light font-monospace overflow-auto">${escapeHtml(result.input)}</pre>` +
            `</div>` +
            `<div class="mb-2">` +
                `<div class="d-flex justify-content-between align-items-end mb-1">` +
                    `<span class="fw-bold small text-light">Output</span>` +
                `</div>` +
                `<pre class="cp-result-pre m-0 p-2 bg-dark border border-secondary rounded-1 ${verdictClass} font-monospace overflow-auto">${escapeHtml(result.actual)}</pre>` +
            `</div>` +
            `<div class="mb-2">` +
                `<div class="d-flex justify-content-between align-items-end mb-1">` +
                    `<span class="fw-bold small text-light">Answer</span>` +
                `</div>` +
                `<pre class="cp-result-pre m-0 p-2 bg-dark border border-secondary rounded-1 text-light font-monospace overflow-auto">${escapeHtml(result.expected)}</pre>` +
            `</div>` +
        `</div>`
    );
}


function renderStressResult(result, testCount) {
    if (result.verdict === 'AC') {
        return `<span class="text-success fs-6 fw-bold">Accepted! Đã vượt qua ${testCount} test(s)</span>`;
    }

    if (result.verdict === 'ERROR') {
        return `<span class="text-danger">Lỗi Biên Dịch / Lỗi Hệ Thống:</span><br><pre class="text-light m-0">${escapeHtml(result.actual)}</pre>`;
    }

    return renderStressFailure(result);
}


async function runStressTest() {
    const consoleOut = document.getElementById('stress-console');
    const btnRun = document.getElementById('btnRunStress');
    if (!consoleOut || !btnRun) return;

    const payload = getStressPayload();
    if (!payload.gen_code.trim() || !payload.brute_code.trim() || !payload.opt_code.trim()) {
        consoleOut.innerHTML = "<span class='text-danger'>Vui lòng nhập đầy đủ code cho cả 3 ô (Generator, Brute-force, Optimized)!</span>";
        return;
    }

    btnRun.disabled = true;
    btnRun.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
    consoleOut.innerHTML = `<span class="text-info">Đang tạo ${payload.test_count} bộ test và kiểm tra đầu ra...</span>`;

    try {
        const result = await postJson('/stress-test', payload);
        consoleOut.innerHTML = renderStressResult(result, payload.test_count);
    } catch (error) {
        consoleOut.innerHTML = `<span class="text-danger">Lỗi gọi Backend: ${escapeHtml(error.message)}</span>`;
    } finally {
        btnRun.disabled = false;
        btnRun.innerHTML = '<i class="fa-solid fa-play"></i> Run';
    }
}


configureMonacoLoader();
