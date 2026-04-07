const container = document.getElementById('graph-container');
let svg = document.getElementById('edges-svg');

let nodes = {}, edges = [], adjList = {};
let nodeIdCounter = 0, startNodeId = null, targetNodeId = null;
let isAnimating = false, draggingNodeId = null;

function clearGraph() {
    if (isAnimating) return;
    container.innerHTML = '<svg id="edges-svg" class="edges-svg"></svg>';
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
    text.textContent = w;
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
    if (speed === 'fast') return 400;   
    if (speed === 'slow') return 1200;  
    return 800;                         
}

function clearPaths() {
    if (isAnimating) return;
    Object.values(nodes).forEach(n => n.el.classList.remove('visited', 'path'));
    edges.forEach(e => {
        e.el.classList.remove('path');
        e.el.style.stroke = '#7f8c8d';
    });
}

function startAlgorithm() {
    if (isAnimating || startNodeId === null || targetNodeId === null) return;
    const algo = document.getElementById('algo-select').value;
    clearPaths();
    if (algo === 'bfs') runBFS();
    else if (algo === 'dfs') runDFS();
    else if (algo === 'dijkstra') runDijkstra();
}

// 3. Cập nhật cách đọc dữ liệu cho BFS và DFS
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
    
    let stack = [startNodeId];
    let visitedOrder = [], targetFound = false;

    while (stack.length > 0) {
        let curr = stack.pop();
        if (visited[curr]) continue;

        visited[curr] = true;
        visitedOrder.push(curr);

        if (curr === targetNodeId) { targetFound = true; break; }

        adjList[curr].forEach(edge => {
            let neighbor = edge.v;
            if (!visited[neighbor]) {
                prev[neighbor] = curr;
                stack.push(neighbor);
            }
        });
    }
    animateAlgorithm(visitedOrder, targetFound ? getShortestPath(prev, targetNodeId) : [], prev);
}

// 4. Cập nhật "Não bộ" Dijkstra để đọc trọng số thủ công
function runDijkstra() {
    let visited = {}, prev = {}, dist = {};
    Object.keys(nodes).forEach(id => { visited[id] = false; prev[id] = null; dist[id] = Infinity; });
    
    dist[startNodeId] = 0;
    let pq = [{ id: startNodeId, dist: 0 }];
    let visitedOrder = [], targetFound = false;

    while(pq.length > 0) {
        pq.sort((a, b) => a.dist - b.dist);
        let curr = pq.shift().id;

        if (visited[curr]) continue;
        visited[curr] = true;
        visitedOrder.push(curr);

        if (curr === targetNodeId) { targetFound = true; break; }

        adjList[curr].forEach(edge => {
            let neighbor = edge.v;
            let weight = edge.w; // Trích xuất trọng số w
            
            if (!visited[neighbor]) {
                let newDist = dist[curr] + weight;
                if (newDist < dist[neighbor]) {
                    dist[neighbor] = newDist; prev[neighbor] = curr;
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
            }
        }, delay * i);
    }
}

function animateShortestPath(pathNodes) {
    if (pathNodes.length === 0) { isAnimating = false; return; }

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
            }

            if (i === pathNodes.length - 1) isAnimating = false;
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
            // Đọc tham số thứ 3 (trọng số), nếu không có thì mặc định là 1
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

    let w = container.clientWidth || 800, h = container.clientHeight || 550;
    let nodeMap = {}; 

    // LƯỢC BỎ: Code tính toán tọa độ Đa giác đều
    // THAY BẰNG: Sinh tọa độ Random ngẫu nhiên trong khung (trừ đi 40px lề để không bị sát viền)
    Array.from(uniqueNodes).forEach((nodeName) => {
        let x = Math.random() * (w - 80) + 40;
        let y = Math.random() * (h - 80) + 40;
        
        let type = 'normal';
        if (nodeName === startInput) type = 'start';
        else if (nodeName === targetInput) type = 'target';
        
        nodeMap[nodeName] = addNode(x, y, type, nodeName);
    });

    // Truyền w vào hàm addEdge
    edgesToBuild.forEach(edge => addEdge(nodeMap[edge[0]], nodeMap[edge[1]], edge[2]));
}