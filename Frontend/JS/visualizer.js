class MinHeap {
    constructor() {
        this.heap = [];
    }

    size() {
        return this.heap.length;
    }

    push(node) {
        this.heap.push(node);
        this.bubbleUp(this.heap.length - 1);
    }

    pop() {
        const top = this.heap[0];
        const last = this.heap.pop();

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.sinkDown(0);
        }

        return top;
    }

    bubbleUp(index) {
        let current = index;

        while (current > 0) {
            const parent = Math.floor((current - 1) / 2);
            if (this.heap[parent].dist <= this.heap[current].dist) break;

            [this.heap[parent], this.heap[current]] = [this.heap[current], this.heap[parent]];
            current = parent;
        }
    }

    sinkDown(index) {
        let current = index;
        const length = this.heap.length;

        while (true) {
            let smallest = current;
            const left = 2 * current + 1;
            const right = 2 * current + 2;

            if (left < length && this.heap[left].dist < this.heap[smallest].dist) {
                smallest = left;
            }

            if (right < length && this.heap[right].dist < this.heap[smallest].dist) {
                smallest = right;
            }

            if (smallest === current) break;

            [this.heap[smallest], this.heap[current]] = [this.heap[current], this.heap[smallest]];
            current = smallest;
        }
    }
}

let container = null;
let svg = null;
let nodes = {};
let edges = [];
let adjList = {};
let nodeIdCounter = 0;
let startNodeId = null;
let targetNodeId = null;
let isAnimating = false;
let draggingNodeId = null;

function escapeVisualizerHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[char]);
}

function showVisualizerStatus(html, tone = 'info') {
    const statusBox = document.getElementById('algo-status-box');
    if (!statusBox) return;

    const colors = {
        error: '#e74c3c',
        success: '#2ecc71',
        warning: '#f1c40f',
        info: '#e0e0e0',
    };

    statusBox.style.display = 'block';
    statusBox.innerHTML = `<span style="color: ${colors[tone] || colors.info}; font-weight: bold;">${html}</span>`;
}

function getNodeDisplayName(id) {
    return escapeVisualizerHtml(nodes[id]?.el?.textContent ?? id);
}

function getSpeedDelay() {
    const speed = document.getElementById('speed-select')?.value;
    if (speed === 'fast') return 500;
    if (speed === 'slow') return 1500;
    return 1000;
}

function syncEdgeWeightLabels() {
    const shouldShowWeight = document.getElementById('algo-select')?.value === 'dijkstra';
    edges.forEach((edge) => {
        if (edge.textEl) {
            edge.textEl.textContent = shouldShowWeight ? edge.w : '';
        }
    });
}

function graphHasInvalidDijkstraWeight() {
    return edges.some((edge) => !Number.isFinite(edge.w) || edge.w < 0);
}

function resetGraphState() {
    nodes = {};
    edges = [];
    adjList = {};
    nodeIdCounter = 0;
    startNodeId = null;
    targetNodeId = null;
    draggingNodeId = null;
}

function clearGraph() {
    if (isAnimating || !container) return;

    container.innerHTML = `
        <div id="algo-status-box" class="algo-status-overlay"></div>
        <svg id="edges-svg" class="edges-svg"></svg>
    `;

    svg = document.getElementById('edges-svg');
    resetGraphState();
}

function clearPaths() {
    if (isAnimating) return;

    Object.values(nodes).forEach((node) => node.el.classList.remove('visited', 'path'));
    edges.forEach((edge) => {
        edge.el.classList.remove('path');
        edge.el.style.stroke = '';
    });

    const statusBox = document.getElementById('algo-status-box');
    if (statusBox) {
        statusBox.style.display = 'none';
    }
}

function addNode(x, y, type = 'normal', label = null) {
    const id = nodeIdCounter++;
    const classNames = String(type || 'normal').split(/\s+/).filter(Boolean);
    const element = document.createElement('div');

    element.className = ['vertex', ...classNames].join(' ');
    element.id = `vertex-${id}`;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.textContent = label !== null ? label : id;

    if (classNames.includes('start')) startNodeId = id;
    if (classNames.includes('target')) targetNodeId = id;

    nodes[id] = { id, x, y, type: classNames.join(' '), el: element };
    adjList[id] = [];
    container.appendChild(element);

    element.addEventListener('mousedown', (event) => {
        if (isAnimating || event.button !== 0) return;
        event.stopPropagation();
        draggingNodeId = id;
    });

    return id;
}

function addEdge(u, v, w = 1) {
    if (!adjList[u] || !adjList[v] || !Number.isFinite(w)) return;
    if (adjList[u].some((edge) => edge.v === v)) return;

    adjList[u].push({ v, w });
    adjList[v].push({ v: u, w });

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.classList.add('edge-line');
    line.id = `edge-${u}-${v}`;
    svg.appendChild(line);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('fill', '#ffd700');
    text.setAttribute('font-size', '14px');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('text-anchor', 'middle');
    text.style.userSelect = 'none';
    text.style.pointerEvents = 'none';
    svg.appendChild(text);

    edges.push({ u, v, w, el: line, textEl: text });
    syncEdgeWeightLabels();
    updateEdges();
}

function updateEdgePosition(edge) {
    const uNode = nodes[edge.u];
    const vNode = nodes[edge.v];
    if (!uNode || !vNode) return;

    edge.el.setAttribute('x1', uNode.x);
    edge.el.setAttribute('y1', uNode.y);
    edge.el.setAttribute('x2', vNode.x);
    edge.el.setAttribute('y2', vNode.y);

    const midX = (uNode.x + vNode.x) / 2;
    const midY = (uNode.y + vNode.y) / 2;
    const dx = vNode.x - uNode.x;
    const dy = vNode.y - uNode.y;
    const length = Math.hypot(dx, dy);

    if (length > 0) {
        const offset = 8;
        edge.textEl.setAttribute('x', midX + offset * (-dy / length));
        edge.textEl.setAttribute('y', midY + offset * (dx / length) + 5);
        return;
    }

    edge.textEl.setAttribute('x', midX);
    edge.textEl.setAttribute('y', midY + 5);
}

function updateEdges() {
    edges.forEach(updateEdgePosition);
}

function parseEdgeList(text, startInput, targetInput) {
    const edgesToBuild = [];
    const uniqueNodes = new Set();

    for (const [lineIndex, rawLine] of text.split('\n').entries()) {
        const line = rawLine.trim();
        if (!line) continue;

        const parts = line.split(/\s+/);
        if (parts.length < 2) {
            return { error: `Dòng ${lineIndex + 1} cần có ít nhất 2 đỉnh.` };
        }

        const [u, v] = parts;
        const w = parts.length >= 3 ? Number(parts[2]) : 1;
        if (!Number.isFinite(w)) {
            return { error: `Trọng số ở dòng ${lineIndex + 1} không hợp lệ.` };
        }

        edgesToBuild.push([u, v, w]);
        uniqueNodes.add(u);
        uniqueNodes.add(v);
    }

    if (startInput) uniqueNodes.add(startInput);
    if (targetInput) uniqueNodes.add(targetInput);

    return { edgesToBuild, uniqueNodes };
}

function fillNumericNodeGaps(uniqueNodes) {
    let isNumeric = true;
    let maxNode = 0;
    let minNode = Infinity;

    uniqueNodes.forEach((node) => {
        const num = parseInt(node, 10);
        if (Number.isNaN(num) || String(num) !== String(node)) {
            isNumeric = false;
            return;
        }

        maxNode = Math.max(maxNode, num);
        minNode = Math.min(minNode, num);
    });

    if (!isNumeric || maxNode <= 0) return;

    const startIndex = minNode === 0 ? 0 : 1;
    for (let i = startIndex; i <= maxNode; i++) {
        uniqueNodes.add(String(i));
    }
}

function sortNodeNames(uniqueNodes) {
    return Array.from(uniqueNodes).sort((a, b) => {
        const numA = Number.parseFloat(a);
        const numB = Number.parseFloat(b);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
            return numA - numB;
        }

        return a.localeCompare(b);
    });
}

function getNodeType(nodeName, startInput, targetInput) {
    if (nodeName === startInput && nodeName === targetInput) return 'start target';
    if (nodeName === startInput) return 'start';
    if (nodeName === targetInput) return 'target';
    return 'normal';
}

function buildGridLayout(nodesArray) {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;
    const count = nodesArray.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const margin = 60;
    const availableWidth = Math.max(0, width - 2 * margin);
    const availableHeight = Math.max(0, height - 2 * margin);
    const stepX = cols > 1 ? availableWidth / (cols - 1) : availableWidth / 2;
    const stepY = rows > 1 ? availableHeight / (rows - 1) : availableHeight / 2;

    return nodesArray.map((nodeName, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        return {
            nodeName,
            x: cols > 1 ? margin + col * stepX : width / 2,
            y: rows > 1 ? margin + row * stepY : height / 2,
        };
    });
}

function buildGraphFromEdgeList() {
    if (isAnimating) return;

    const text = document.getElementById('edge-list-input')?.value.trim() || '';
    const startInput = document.getElementById('start-node-input')?.value.trim() || '';
    const targetInput = document.getElementById('target-node-input')?.value.trim() || '';

    if (!text) {
        showVisualizerStatus('Vui lòng nhập danh sách cạnh trước khi dựng đồ thị.', 'warning');
        return;
    }

    const parsed = parseEdgeList(text, startInput, targetInput);
    if (parsed.error) {
        showVisualizerStatus(parsed.error, 'error');
        return;
    }

    if (parsed.uniqueNodes.size === 0) return;

    fillNumericNodeGaps(parsed.uniqueNodes);
    clearGraph();

    const nodeMap = {};
    const nodesArray = sortNodeNames(parsed.uniqueNodes);
    buildGridLayout(nodesArray).forEach(({ nodeName, x, y }) => {
        nodeMap[nodeName] = addNode(x, y, getNodeType(nodeName, startInput, targetInput), nodeName);
    });

    parsed.edgesToBuild.forEach(([u, v, w]) => addEdge(nodeMap[u], nodeMap[v], w));
}

function createSearchState() {
    const visited = {};
    const prev = {};

    Object.keys(nodes).forEach((id) => {
        visited[id] = false;
        prev[id] = null;
    });

    return { visited, prev };
}

function runBFS() {
    const { visited, prev } = createSearchState();
    const queue = [startNodeId];
    const visitedOrder = [];
    let targetFound = false;

    visited[startNodeId] = true;

    while (queue.length > 0) {
        const curr = queue.shift();
        visitedOrder.push(curr);

        if (curr === targetNodeId) {
            targetFound = true;
            break;
        }

        adjList[curr].forEach((edge) => {
            const neighbor = edge.v;
            if (visited[neighbor]) return;

            visited[neighbor] = true;
            prev[neighbor] = curr;
            queue.push(neighbor);
        });
    }

    animateAlgorithm(visitedOrder, targetFound ? getShortestPath(prev, targetNodeId) : [], prev);
}

function runDFS() {
    const { visited, prev } = createSearchState();
    const visitedOrder = [];
    let targetFound = false;

    function dfs(curr) {
        if (targetFound) return;

        visited[curr] = true;
        visitedOrder.push(curr);

        if (curr === targetNodeId) {
            targetFound = true;
            return;
        }

        for (const edge of adjList[curr]) {
            const neighbor = edge.v;
            if (!visited[neighbor]) {
                prev[neighbor] = curr;
                dfs(neighbor);
            }
            if (targetFound) return;
        }
    }

    dfs(startNodeId);
    animateAlgorithm(visitedOrder, targetFound ? getShortestPath(prev, targetNodeId) : [], prev);
}

function runDijkstra() {
    const visited = {};
    const prev = {};
    const dist = {};
    const pq = new MinHeap();
    const visitedOrder = [];
    let targetFound = false;

    Object.keys(nodes).forEach((id) => {
        visited[id] = false;
        prev[id] = null;
        dist[id] = Infinity;
    });

    dist[startNodeId] = 0;
    pq.push({ id: startNodeId, dist: 0 });

    while (pq.size() > 0) {
        const { id: curr } = pq.pop();
        if (visited[curr]) continue;

        visited[curr] = true;
        visitedOrder.push(curr);

        if (curr === targetNodeId) {
            targetFound = true;
            break;
        }

        adjList[curr].forEach((edge) => {
            const neighbor = edge.v;
            const nextDist = dist[curr] + edge.w;
            if (visited[neighbor] || nextDist >= dist[neighbor]) return;

            dist[neighbor] = nextDist;
            prev[neighbor] = curr;
            pq.push({ id: neighbor, dist: nextDist });
        });
    }

    animateAlgorithm(visitedOrder, targetFound ? getShortestPath(prev, targetNodeId) : [], prev);
}

function getShortestPath(prev, target) {
    const path = [];
    let curr = target;

    while (curr !== null) {
        path.unshift(curr);
        curr = prev[curr];
    }

    return path;
}

function startAlgorithm() {
    if (isAnimating) return;

    const algo = document.getElementById('algo-select')?.value;
    clearPaths();

    if (startNodeId === null || targetNodeId === null) {
        showVisualizerStatus('Vui lòng nhập cả đỉnh xuất phát và đích đến.', 'warning');
        return;
    }

    if (algo === 'dijkstra' && graphHasInvalidDijkstraWeight()) {
        showVisualizerStatus('Dijkstra chỉ hỗ trợ trọng số không âm và hợp lệ.', 'error');
        return;
    }

    const btnRun = document.getElementById('btnRunAlgo');
    if (btnRun) {
        btnRun.disabled = true;
        btnRun.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang chạy...';
    }

    document.getElementById('algo-status-box')?.style.setProperty('display', 'block');

    if (algo === 'bfs') runBFS();
    if (algo === 'dfs') runDFS();
    if (algo === 'dijkstra') runDijkstra();
}

function setTraversalStatus(prev, curr) {
    const statusBox = document.getElementById('algo-status-box');
    if (!statusBox) return;

    if (prev !== null) {
        const edgeEl = document.getElementById(`edge-${prev}-${curr}`) || document.getElementById(`edge-${curr}-${prev}`);
        if (edgeEl) {
            edgeEl.style.stroke = '#3498db';
        }

        statusBox.innerHTML = `Đang duyệt: <span class="node-highlight">${getNodeDisplayName(prev)}</span> ➔ <span class="node-highlight">${getNodeDisplayName(curr)}</span>`;
        return;
    }

    statusBox.innerHTML = `Bắt đầu tại: <span class="node-highlight">${getNodeDisplayName(curr)}</span>`;
}

function animateAlgorithm(visitedOrder, pathNodes, prev) {
    isAnimating = true;
    const delay = getSpeedDelay();

    visitedOrder.forEach((curr, index) => {
        setTimeout(() => {
            if (curr !== startNodeId && curr !== targetNodeId) {
                nodes[curr].el.classList.add('visited');
            }

            setTraversalStatus(prev[curr], curr);
        }, delay * index);
    });

    setTimeout(() => animateShortestPath(pathNodes), delay * visitedOrder.length);
}

function finishAnimation(message, tone) {
    isAnimating = false;
    showVisualizerStatus(message, tone);

    const btnRun = document.getElementById('btnRunAlgo');
    if (btnRun) {
        btnRun.disabled = false;
        btnRun.innerHTML = 'Chạy thuật toán';
    }
}

function animateShortestPath(pathNodes) {
    if (pathNodes.length === 0) {
        finishAnimation('Không tìm thấy đường đi!', 'error');
        return;
    }

    const pathDelay = getSpeedDelay() / 2;

    pathNodes.forEach((curr, index) => {
        setTimeout(() => {
            if (curr !== startNodeId && curr !== targetNodeId) {
                nodes[curr].el.classList.add('path');
            }

            if (index > 0) {
                const prevNode = pathNodes[index - 1];
                const edgeEl = document.getElementById(`edge-${prevNode}-${curr}`) || document.getElementById(`edge-${curr}-${prevNode}`);
                if (edgeEl) {
                    edgeEl.classList.add('path');
                    edgeEl.style.stroke = '';
                }

                const statusBox = document.getElementById('algo-status-box');
                if (statusBox) {
                    statusBox.innerHTML = `Truy vết: <span style="color:#f1c40f; font-weight:bold;">${getNodeDisplayName(prevNode)}</span> ➔ <span style="color:#f1c40f; font-weight:bold;">${getNodeDisplayName(curr)}</span>`;
                }
            }

            if (index === pathNodes.length - 1) {
                finishAnimation('Đã hoàn thành!', 'success');
            }
        }, pathDelay * index);
    });
}

function initVisualizer() {
    container = document.getElementById('graph-container');
    svg = document.getElementById('edges-svg');
    if (!container) return;

    document.getElementById('algo-select')?.addEventListener('change', syncEdgeWeightLabels);

    container.addEventListener('mousemove', (event) => {
        if (isAnimating || draggingNodeId === null || !nodes[draggingNodeId]) return;

        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        nodes[draggingNodeId].x = x;
        nodes[draggingNodeId].y = y;
        nodes[draggingNodeId].el.style.left = `${x}px`;
        nodes[draggingNodeId].el.style.top = `${y}px`;

        updateEdges();
    });

    window.addEventListener('mouseup', () => {
        draggingNodeId = null;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initVisualizer();
    clearGraph();
});
