/* 1. ĐIỀU HƯỚNG TAB & SIDEBAR */
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    const selectedContent = document.getElementById(tabId);
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.style.display = 'block';
    }

    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    const clickedMenu = document.querySelector(`.menu-item[onclick*="${tabId}"]`);
    if (clickedMenu) clickedMenu.classList.add('active');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

/* 2. QUẢN LÝ POP-UP MODAL */
function closeErrorModal() {
    document.getElementById('error-modal').style.display = 'none';
}

/* 3. HỆ THỐNG KÉO THẢ VÁCH NGĂN (RESIZER) */
function makeResizable(resizerId, elem1Id, elem2Id, direction) {
    const resizer = document.getElementById(resizerId);
    const elem1 = document.getElementById(elem1Id);
    const elem2 = document.getElementById(elem2Id);
    
    if (!resizer || !elem1 || !elem2) return;

    let startPos, startSize1, startSize2;

    resizer.addEventListener('mousedown', function(e) {
        e.preventDefault(); 
        
        startPos = direction === 'horizontal' ? e.clientX : e.clientY;
        startSize1 = elem1.getBoundingClientRect()[direction === 'horizontal' ? 'width' : 'height'];
        startSize2 = elem2.getBoundingClientRect()[direction === 'horizontal' ? 'width' : 'height'];

        resizer.classList.add('resizing');
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        const onMouseMove = function(e) {
            const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
            const delta = currentPos - startPos;
            const containerSize = elem1.parentElement.getBoundingClientRect()[direction === 'horizontal' ? 'width' : 'height'];
            
            const newSize1 = ((startSize1 + delta) / containerSize) * 100;
            const newSize2 = ((startSize2 - delta) / containerSize) * 100;

            if (newSize1 > 10 && newSize2 > 10) {
                if (direction === 'horizontal') {
                    elem1.style.width = `${newSize1}%`;
                    elem2.style.width = `${newSize2}%`;
                } else {
                    elem1.style.height = `${newSize1}%`;
                    elem2.style.height = `${newSize2}%`;
                }
                
                // Ép các Monaco Editor (nếu có) vẽ lại kích thước
                if (typeof mainEditor !== 'undefined' && mainEditor) mainEditor.layout();
                if (typeof genEditor !== 'undefined' && genEditor) genEditor.layout();
                if (typeof bruteEditor !== 'undefined' && bruteEditor) bruteEditor.layout();
                if (typeof optEditor !== 'undefined' && optEditor) optEditor.layout();
            }
        };

        const onMouseUp = function() {
            resizer.classList.remove('resizing');
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    makeResizable('resizer-1', 'col-gen', 'col-brute', 'horizontal');
    makeResizable('resizer-2', 'col-brute', 'col-opt', 'horizontal');
    makeResizable('resizer-test-h', 'stress-editors-row', 'stress-console-row', 'vertical');
    makeResizable('resizer-ide-v', 'main-editor-col', 'io-col', 'horizontal');
    makeResizable('resizer-ide-h', 'input-row', 'output-row', 'vertical');
});