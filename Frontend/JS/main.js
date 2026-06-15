const THEME_STORAGE_KEY = 'cp-helper-theme';
const APP_THEMES = new Set(['dark', 'warm']);


function getWindowValue(name) {
    return /** @type {any} */ (window)[name];
}


function getWindowFunction(name) {
    const value = getWindowValue(name);
    return typeof value === 'function' ? value : null;
}


function getStoredTheme() {
    try {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        return APP_THEMES.has(storedTheme) ? storedTheme : 'dark';
    } catch (error) {
        return 'dark';
    }
}


function setAppTheme(theme, shouldPersist = true) {
    const nextTheme = APP_THEMES.has(theme) ? theme : 'dark';
    document.documentElement.setAttribute('data-bs-theme', nextTheme);
    document.body.setAttribute('data-bs-theme', nextTheme);

    document.querySelectorAll('[data-theme-option]').forEach((button) => {
        button.classList.toggle('active', button.dataset.themeOption === nextTheme);
    });

    if (shouldPersist) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        } catch (error) {
            console.warn('Theme preference could not be saved', error);
        }
    }

    const applyTheme = getWindowFunction('applyEditorTheme');
    if (applyTheme) {
        applyTheme(nextTheme);
    }
}


function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.remove('active');
        content.style.display = '';
    });

    const selectedContent = document.getElementById(tabId);
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.style.display = '';
    }

    document.querySelectorAll('.menu-item').forEach((item) => item.classList.remove('active'));
    document.querySelector(`.menu-item[onclick*="${tabId}"]`)?.classList.add('active');

    setTimeout(refreshEditorsLayout, 50);
}


function getKnownEditors() {
    return [
        typeof mainEditor !== 'undefined' ? mainEditor : null,
        typeof genEditor !== 'undefined' ? genEditor : null,
        typeof bruteEditor !== 'undefined' ? bruteEditor : null,
        typeof optEditor !== 'undefined' ? optEditor : null,
    ].filter(Boolean);
}


function layoutEditorIfAvailable(editor) {
    if (editor && typeof editor.layout === 'function') {
        editor.layout();
    }
}


function resizeFallbackEditor(containerId) {
    const container = document.getElementById(containerId);
    const parent = container?.parentElement;
    if (!container || !parent) return;

    const toolbar = parent.querySelector('.cp-toolbar, .cp-toolbar-compact');
    const toolbarHeight = toolbar ? toolbar.getBoundingClientRect().height : 0;
    const totalHeight = parent.getBoundingClientRect().height;
    const nextHeight = `${Math.max(0, totalHeight - toolbarHeight)}px`;
    const textarea = container.querySelector('textarea');

    if (textarea) {
        textarea.style.height = nextHeight;
    } else {
        container.style.height = nextHeight;
    }
}


function refreshEditorsLayout() {
    try {
        getKnownEditors().forEach(layoutEditorIfAvailable);
    } catch (error) {
        console.warn('refreshEditorsLayout: editor layout error', error);
    }

    ['monaco-editor', 'editor-gen', 'editor-brute', 'editor-opt'].forEach(resizeFallbackEditor);
}


function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('collapsed');
}


function getBootstrapModal(modalEl) {
    const bootstrapApi = getWindowValue('bootstrap');
    return bootstrapApi?.Modal ? bootstrapApi.Modal.getOrCreateInstance(modalEl) : null;
}


function ensureFallbackBackdrop() {
    let backdrop = document.querySelector('[data-cp-modal-backdrop]');
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    backdrop.setAttribute('data-cp-modal-backdrop', 'true');
    document.body.appendChild(backdrop);
    return backdrop;
}


function removeFallbackBackdrop() {
    document.querySelector('[data-cp-modal-backdrop]')?.remove();
}


function showFallbackModal(modalEl) {
    modalEl.style.display = 'block';
    modalEl.removeAttribute('aria-hidden');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('role', 'dialog');
    modalEl.classList.add('show');
    document.body.classList.add('modal-open');
    ensureFallbackBackdrop();
}


function hideFallbackModal(modalEl) {
    modalEl.classList.remove('show');
    modalEl.style.display = 'none';
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.removeAttribute('aria-modal');
    modalEl.removeAttribute('role');
    document.body.classList.remove('modal-open');
    removeFallbackBackdrop();
}


function showErrorModal() {
    const modalEl = document.getElementById('error-modal');
    if (!modalEl) return;

    try {
        const modal = getBootstrapModal(modalEl);
        if (modal) {
            modal.show();
            return;
        }
    } catch (error) {
        console.warn('Bootstrap modal failed, using fallback modal', error);
    }

    showFallbackModal(modalEl);
}


function closeErrorModal() {
    const modalEl = document.getElementById('error-modal');
    if (!modalEl) return;

    try {
        const modal = getBootstrapModal(modalEl);
        if (modal) {
            modal.hide();
            return;
        }
    } catch (error) {
        console.warn('Bootstrap modal failed to close, using fallback modal', error);
    }

    hideFallbackModal(modalEl);
}


function initializeModalFallback() {
    const modalEl = document.getElementById('error-modal');
    if (!modalEl) return;

    modalEl.addEventListener('click', (event) => {
        const target = event.target;
        if (target === modalEl || target.closest?.('[data-bs-dismiss="modal"]')) {
            closeErrorModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modalEl.classList.contains('show')) {
            closeErrorModal();
        }
    });
}


function getResizeAxis(direction) {
    return direction === 'horizontal'
        ? { cursor: 'col-resize', eventKey: 'clientX', sizeKey: 'width' }
        : { cursor: 'row-resize', eventKey: 'clientY', sizeKey: 'height' };
}


function applyResize(elem1, elem2, direction, size1, size2) {
    if (direction === 'horizontal') {
        elem1.style.width = `${size1}%`;
        elem2.style.width = `${size2}%`;
        elem1.style.flexBasis = `${size1}%`;
        elem2.style.flexBasis = `${size2}%`;
        return;
    }

    elem1.style.height = `${size1}%`;
    elem2.style.height = `${size2}%`;
}


function makeResizable(resizerId, elem1Id, elem2Id, direction) {
    const resizer = document.getElementById(resizerId);
    const elem1 = document.getElementById(elem1Id);
    const elem2 = document.getElementById(elem2Id);
    if (!resizer || !elem1 || !elem2) return;

    const axis = getResizeAxis(direction);
    let startPos = 0;
    let startSize1 = 0;
    let startSize2 = 0;

    resizer.addEventListener('mousedown', (event) => {
        event.preventDefault();

        startPos = event[axis.eventKey];
        startSize1 = elem1.getBoundingClientRect()[axis.sizeKey];
        startSize2 = elem2.getBoundingClientRect()[axis.sizeKey];

        resizer.classList.add('resizing');
        document.body.style.cursor = axis.cursor;
        document.body.style.userSelect = 'none';

        const onMouseMove = (moveEvent) => {
            const delta = moveEvent[axis.eventKey] - startPos;
            const containerSize = elem1.parentElement.getBoundingClientRect()[axis.sizeKey];
            if (containerSize <= 0) return;

            const nextSize1 = ((startSize1 + delta) / containerSize) * 100;
            const nextSize2 = ((startSize2 - delta) / containerSize) * 100;
            if (nextSize1 <= 10 || nextSize2 <= 10) return;

            applyResize(elem1, elem2, direction, nextSize1, nextSize2);
            refreshEditorsLayout();
        };

        const onMouseUp = () => {
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            refreshEditorsLayout();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}


function initializeThemeSwitcher() {
    document.querySelectorAll('[data-theme-option]').forEach((button) => {
        button.addEventListener('click', () => setAppTheme(button.dataset.themeOption));
    });

    setAppTheme(getStoredTheme(), false);
}


function initializeResizers() {
    makeResizable('resizer-1', 'col-gen', 'col-brute', 'horizontal');
    makeResizable('resizer-2', 'col-brute', 'col-opt', 'horizontal');
    makeResizable('resizer-test-h', 'stress-editors-row', 'stress-console-row', 'vertical');
    makeResizable('resizer-ide-v', 'main-editor-col', 'io-col', 'horizontal');
    makeResizable('resizer-ide-h', 'input-row', 'output-row', 'vertical');
}


setAppTheme(getStoredTheme(), false);

document.addEventListener('DOMContentLoaded', () => {
    initializeThemeSwitcher();
    initializeModalFallback();
    initializeResizers();
    setTimeout(refreshEditorsLayout, 100);

    window.addEventListener('resize', refreshEditorsLayout);
    document.addEventListener('mouseup', refreshEditorsLayout);
});
