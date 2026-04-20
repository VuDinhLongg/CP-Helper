class MinHeap {
    constructor() {
        this.heap = []; // Mảng lưu các node { id, dist }
    }

    // Trả về size
    size() { return this.heap.length; }

    // Xem phần tử nhỏ nhất mà không lấy ra
    peek() { return this.heap[0]; }

    // Thêm phần tử mới vào heap, rồi "nổi" lên đúng vị trí
    push(node) {
        this.heap.push(node);
        this._bubbleUp(this.heap.length - 1);
    }

    // Lấy phần tử nhỏ nhất ra, rồi "chìm" root mới xuống đúng vị trí
    pop() {
        const top = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this._sinkDown(0);
        }
        return top;
    }

    // Đẩy node tại index i lên trên nếu nhỏ hơn cha
    _bubbleUp(i) {
        while (i > 0) {
            const parent = Math.floor((i - 1) / 2);
            if (this.heap[parent].dist <= this.heap[i].dist) break;
            [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
            i = parent;
        }
    }

    // Đẩy node tại index i xuống dưới nếu lớn hơn con
    _sinkDown(i) {
        const n = this.heap.length;
        while (true) {
            let smallest = i;
            const left  = 2 * i + 1;
            const right = 2 * i + 2;
            if (left  < n && this.heap[left].dist  < this.heap[smallest].dist) smallest = left;
            if (right < n && this.heap[right].dist < this.heap[smallest].dist) smallest = right;
            if (smallest === i) break;
            [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
            i = smallest;
        }
    }
}

const container = document.getElementById('graph-container');
let svg = document.getElementById('edges-svg');

let nodes = {}, edges = [], adjList = {};
let nodeIdCounter = 0, startNodeId = null, targetNodeId = null;
let isAnimating = false, draggingNodeId = null;

function clearGraph() {
    if (isAnimating) return;
    
    // Cập nhật: Khi xóa đồ thị, phải giữ lại cả bảng Status Box và thẻ SVG
    container.innerHTML = `
        <div id="algo-status-box" class="algo-status-overlay"></div>
        <svg id="edges-svg" class="edges-svg"></svg>
    `;
    
    svg = document.getElementById('edges-svg');
    nodes = {}; edges = []; adjList = {}; 
    nodeIdCounter = 0; startNodeId = null; targetNodeId = null;
    draggingNodeId = null;
}

document.addEventListener('DOMContentLoaded', clearGraph);

function addNode(x, y, type = 'normal', customLabel = null) {
    const id = nodeIdCounter++;
    const el = document.createElement('div');
    el.className = `vertex ${type}`;
    el.id = `vertex-${id}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.textContent = customLabel !== null ? customLabel : id; 

    if (type === 'start') startNodeId = id;
    if (type === 'target') targetNodeId = id;

    nodes[id] = { id, x, y, type, el };
    adjList[id] = [];
    container.appendChild(el);

    el.addEventListener('mousedown', (e) => {
        if (isAnimating || e.button !== 0) return; 
        e.stopPropagation();
        draggingNodeId = id;
    });

    return id;
}

// 1. Nâng cấp hàm addEdge để nhận thêm biến w (trọng số)
function addEdge(u, v, w = 1) {
    // Cập nhật cách kiểm tra trùng cạnh
    if (adjList[u].some(edge => edge.v === v)) return;
    
    // Lưu thẳng trọng số vào Danh sách kề
    adjList[u].push({ v: v, w: w }); 
    adjList[v].push({ v: u, w: w }); 

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.classList.add('edge-line');
    line.id = `edge-${u}-${v}`;
    svg.appendChild(line);

    // Tạo thẻ Text (Chữ) của SVG để hiển thị con số lên màn hình
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    
    // NẾU TRỌNG SỐ LÀ 1 (MẶC ĐỊNH) THÌ ẨN ĐI, KHÁC 1 THÌ MỚI HIỆN
    text.textContent = (w === 1) ? "" : w; 
    
    text.setAttribute('fill', '#ffd700'); 
    text.setAttribute('font-size', '14px');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#ffd700'); // Trọng số hiển thị màu vàng cho nổi bật
    text.setAttribute('font-size', '14px');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('text-anchor', 'middle');
    text.style.userSelect = 'none'; // Không cho bôi đen text
    text.style.pointerEvents = 'none'; // Chuột xuyên qua text để không bị lỗi kéo thả
    svg.appendChild(text);

    // Lưu cả line và text vào mảng
    edges.push({ u, v, el: line, textEl: text });
    updateEdges();
}

function updateEdges() {
    edges.forEach(edge => {
        let uNode = nodes[edge.u];
        let vNode = nodes[edge.v];
        
        // Cập nhật vị trí đường thẳng
        edge.el.setAttribute('x1', uNode.x);
        edge.el.setAttribute('y1', uNode.y);
        edge.el.setAttribute('x2', vNode.x);
        edge.el.setAttribute('y2', vNode.y);
        
        // Tính toán điểm chính giữa (Midpoint)
        let midX = (uNode.x + vNode.x) / 2;
        let midY = (uNode.y + vNode.y) / 2;
        
        // --- CHỈNH SỬA TỌA ĐỘ TEXT TRỌNG SỐ ---
        
        // Tính vectơ hiệu
        let dx = vNode.x - uNode.x;
        let dy = vNode.y - uNode.y;
        
        // Tính độ dài cạnh
        let length = Math.hypot(dx, dy);
        
        // Xử lý trường hợp 2 đỉnh trùng nhau (độ dài bằng 0)
        if (length > 0) {
            // Xác định khoảng cách văn bản "dạt" ra khỏi cạnh (tính theo pixel)
            // Bạn có thể tăng giảm số 18 này để thay đổi khoảng cách
            let offsetDistance = 8; 
            
            // Tính toán vectơ pháp tuyến (Normal vector) vuông góc với cạnh.
            // Công thức: Normal = (-dy, dx). Chúng ta chuẩn hóa (Unit vector).
            // Vị trí text = Midpoint + (OffsetDistance * UnitNormal)
            let textX = midX + offsetDistance * (-dy / length);
            let textY = midY + offsetDistance * (dx / length);
            
            edge.textEl.setAttribute('x', textX);
            edge.textEl.setAttribute('y', textY + 5); // Cộng thêm 5 để căn giữa theo chiều dọc
        } else {
            // Nếu độ dài bằng 0, đặt text tại chính giữa đỉnh
            edge.textEl.setAttribute('x', midX);
            edge.textEl.setAttribute('y', midY + 5);
        }
    });
}

container.addEventListener('mousemove', (e) => {
    if (isAnimating || draggingNodeId === null) return;
    const rect = container.getBoundingClientRect();
    let x = e.clientX - rect.left; 
    let y = e.clientY - rect.top;
    
    nodes[draggingNodeId].x = x; 
    nodes[draggingNodeId].y = y;
    nodes[draggingNodeId].el.style.left = `${x}px`; 
    nodes[draggingNodeId].el.style.top = `${y}px`;
    
    updateEdges();
});

window.addEventListener('mouseup', () => { draggingNodeId = null; });

function getSpeedDelay() {
    const speed = document.getElementById('speed-select').value;
    if (speed === 'fast') return 500;   
    if (speed === 'slow') return 1500;  
    return 1000;
}

function clearPaths() {
    if (isAnimating) return;
    Object.values(nodes).forEach(n => n.el.classList.remove('visited', 'path'));
    edges.forEach(e => {
        e.el.classList.remove('path');
        e.el.style.stroke = '#7f8c8d';
    });
    
    const statusBox = document.getElementById('algo-status-box');
    if (statusBox) statusBox.style.display = 'none';
}

function startAlgorithm() {
    if (isAnimating || startNodeId === null || targetNodeId === null) return;

    const btnRun = document.getElementById('btnRunAlgo');
    if (btnRun) {
        btnRun.disabled = true; // Khóa nút không cho bấm 2 lần
        btnRun.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang chạy...';
    }

    const algo = document.getElementById('algo-select').value;
    clearPaths();
    
    // Bật bảng Log lên khi bắt đầu chạy
    const statusBox = document.getElementById('algo-status-box');
    if (statusBox) {
        statusBox.style.display = 'block';
    }

    if (algo === 'bfs') runBFS();
    else if (algo === 'dfs') runDFS();
    else if (algo === 'dijkstra') runDijkstra();
}

function runBFS() {
    let visited = {}, prev = {};
    Object.keys(nodes).forEach(id => { visited[id] = false; prev[id] = null; });
    
    let queue = [startNodeId];
    visited[startNodeId] = true;
    let visitedOrder = [], targetFound = false;

    while (queue.length > 0) {
        let curr = queue.shift();
        visitedOrder.push(curr);

        if (curr === targetNodeId) { targetFound = true; break; }

        adjList[curr].forEach(edge => {
            let neighbor = edge.v; // Trích xuất đỉnh kề
            if (!visited[neighbor]) {
                visited[neighbor] = true; prev[neighbor] = curr;
                queue.push(neighbor);
            }
        });
    }
    animateAlgorithm(visitedOrder, targetFound ? getShortestPath(prev, targetNodeId) : [], prev);
}

function runDFS() {
    let visited = {}, prev = {};
    Object.keys(nodes).forEach(id => { visited[id] = false; prev[id] = null; });

    let visitedOrder = [], targetFound = false;

    // Hàm đệ quy nội bộ — trả về true nếu tìm thấy target
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
                if (targetFound) return;
            }
        }
    }

    dfs(startNodeId);
    animateAlgorithm(visitedOrder, targetFound ? getShortestPath(prev, targetNodeId) : [], prev);
}

function runDijkstra() {
    let visited = {}, prev = {}, dist = {};
    Object.keys(nodes).forEach(id => { visited[id] = false; prev[id] = null; dist[id] = Infinity; });

    dist[startNodeId] = 0;

    const pq = new MinHeap();
    pq.push({ id: startNodeId, dist: 0 });

    let visitedOrder = [], targetFound = false;

    while (pq.size() > 0) {
        const { id: curr } = pq.pop();

        if (visited[curr]) continue;
        visited[curr] = true;
        visitedOrder.push(curr);

        if (curr === targetNodeId) { targetFound = true; break; }

        adjList[curr].forEach(edge => {
            const neighbor = edge.v;
            const weight   = edge.w;

            if (!visited[neighbor]) {
                const newDist = dist[curr] + weight;
                if (newDist < dist[neighbor]) {
                    dist[neighbor]  = newDist;
                    prev[neighbor]  = curr;
                    pq.push({ id: neighbor, dist: newDist });
                }
            }
        });
    }

    animateAlgorithm(visitedOrder, targetFound ? getShortestPath(prev, targetNodeId) : [], prev);
}

function getShortestPath(prev, target) {
    let path = [], curr = target;
    while(curr !== null) {
        path.unshift(curr);
        curr = prev[curr];
    }
    return path;
}

function animateAlgorithm(visitedOrder, pathNodes, prev) {
    isAnimating = true; 
    const delay = getSpeedDelay();
    const statusBox = document.getElementById('algo-status-box');

    for (let i = 0; i <= visitedOrder.length; i++) {
        if (i === visitedOrder.length) {
            setTimeout(() => { animateShortestPath(pathNodes); }, delay * i);
            return;
        }

        setTimeout(() => {
            const curr = visitedOrder[i];
            if (curr !== startNodeId && curr !== targetNodeId) {
                nodes[curr].el.classList.add('visited');
            }
            
            if (prev[curr] !== null) {
                let u = prev[curr], v = curr;
                let edgeEl = document.getElementById(`edge-${u}-${v}`) || document.getElementById(`edge-${v}-${u}`);
                if (edgeEl) edgeEl.style.stroke = '#3498db';

                // BÁO CÁO: Đang xét từ u sang v
                if (statusBox) {
                    let nameU = nodes[u].el.textContent;
                    let nameV = nodes[v].el.textContent;
                    statusBox.innerHTML = `Đang duyệt: <span class="node-highlight">${nameU}</span> ➔ <span class="node-highlight">${nameV}</span>`;
                }
            } else if (curr === startNodeId) {
                // BÁO CÁO: Điểm xuất phát
                if (statusBox) {
                    let nameStart = nodes[curr].el.textContent;
                    statusBox.innerHTML = `Bắt đầu tại: <span class="node-highlight">${nameStart}</span>`;
                }
            }
        }, delay * i);
    }
}

function animateShortestPath(pathNodes) {
    const statusBox = document.getElementById('algo-status-box');
    const btnRun = document.getElementById('btnRunAlgo');

    if (pathNodes.length === 0) { 
        isAnimating = false; 
        if (statusBox) statusBox.innerHTML = `<span style="color: #e74c3c; font-weight: bold;">Không tìm thấy đường đi!</span>`;
        
        if (btnRun) { btnRun.disabled = false; btnRun.innerHTML = 'Chạy thuật toán'; } 
        return; 
    }

    for (let i = 0; i < pathNodes.length; i++) {
        setTimeout(() => {
            let curr = pathNodes[i];
            if (curr !== startNodeId && curr !== targetNodeId) {
                nodes[curr].el.classList.add('path');
            }
            
            if (i > 0) {
                let u = pathNodes[i-1], v = curr;
                let edgeEl = document.getElementById(`edge-${u}-${v}`) || document.getElementById(`edge-${v}-${u}`);
                if (edgeEl) {
                    edgeEl.classList.add('path');
                    edgeEl.style.stroke = ''; 
                }
                
                if (statusBox) {
                    let nameU = nodes[u].el.textContent;
                    let nameV = nodes[v].el.textContent;
                    statusBox.innerHTML = `Truy vết: <span style="color:#f1c40f; font-weight:bold;">${nameU}</span> ➔ <span style="color:#f1c40f; font-weight:bold;">${nameV}</span>`;
                }
            }

            if (i === pathNodes.length - 1) {
                isAnimating = false;
                if (statusBox) statusBox.innerHTML = `<span style="color: #2ecc71; font-weight: bold;">Đã hoàn thành!</span>`;
                
                if (btnRun) { btnRun.disabled = false; btnRun.innerHTML = 'Chạy thuật toán'; } 
            }
        }, (getSpeedDelay() / 2) * i); 
    }
}

function buildGraphFromEdgeList() {
    if (isAnimating) return;
    
    const text = document.getElementById('edge-list-input').value.trim();
    const startInput = document.getElementById('start-node-input').value.trim();
    const targetInput = document.getElementById('target-node-input').value.trim();
    
    if (!text) return;

    const lines = text.split('\n');
    let edgesToBuild = [];
    let uniqueNodes = new Set(); 

    lines.forEach(line => {
        const parts = line.trim().split(/\s+/); 
        if (parts.length >= 2) {
            let u = parts[0];
            let v = parts[1];
            let w = parts.length >= 3 ? parseFloat(parts[2]) : 1; 
            
            edgesToBuild.push([u, v, w]);
            uniqueNodes.add(u);
            uniqueNodes.add(v);
        }
    });

    if (startInput) uniqueNodes.add(startInput);
    if (targetInput) uniqueNodes.add(targetInput);

    if (uniqueNodes.size === 0) return;
    clearGraph();

    let w_container = container.clientWidth || 800;
    let h_container = container.clientHeight || 550;
    let nodeMap = {}; 

    // 1. SẮP XẾP DANH SÁCH ĐỈNH TĂNG DẦN (Để đỉnh 1, 2, 3... xếp theo thứ tự)
    let nodesArray = Array.from(uniqueNodes).sort((a, b) => {
        let numA = parseFloat(a), numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    });

    // 2. THUẬT TOÁN CHIA LƯỚI (GRID LAYOUT)
    let numNodes = nodesArray.length;
    let cols = Math.ceil(Math.sqrt(numNodes)); // Tính số cột (Lấy căn bậc 2)
    let rows = Math.ceil(numNodes / cols);     // Tính số hàng tương ứng

    // Khoảng cách lề so với viền Canvas (để đỉnh không bị dính vách)
    let margin = 60; 
    let availableWidth = w_container - 2 * margin;
    let availableHeight = h_container - 2 * margin;

    // Khoảng cách giữa các đỉnh (Tránh chia cho 0 nếu chỉ có 1 cột/hàng)
    let stepX = cols > 1 ? availableWidth / (cols - 1) : availableWidth / 2;
    let stepY = rows > 1 ? availableHeight / (rows - 1) : availableHeight / 2;

    // 3. RẢI ĐỈNH LÊN LƯỚI
    nodesArray.forEach((nodeName, index) => {
        // Xác định vị trí hàng (r) và cột (c) của đỉnh hiện tại
        let r = Math.floor(index / cols);
        let c = index % cols;

        // Tính toán tọa độ X, Y
        let x = cols > 1 ? margin + c * stepX : w_container / 2;
        let y = rows > 1 ? margin + r * stepY : h_container / 2;
        
        let type = 'normal';
        if (nodeName === startInput) type = 'start';
        else if (nodeName === targetInput) type = 'target';
        
        nodeMap[nodeName] = addNode(x, y, type, nodeName);
    });

    // Vẽ cạnh nối
    edgesToBuild.forEach(edge => addEdge(nodeMap[edge[0]], nodeMap[edge[1]], edge[2]));
}