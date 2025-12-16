/**
 * Local HTTP Server for Hand Tracking
 * Serves the hand tracking page and receives gesture events via POST
 */

import * as http from 'http';

export type GestureCallback = (gesture: string) => void;

export class TrackingServer {
    private server: http.Server | null = null;
    private port: number = 0;
    private onGestureCallback: GestureCallback | null = null;

    async start(): Promise<number> {
        if (this.server) {
            return this.port;
        }

        return new Promise((resolve, reject) => {
            this.server = http.createServer((req, res) => {
                this.handleRequest(req, res);
            });

            this.server.listen(0, 'localhost', () => {
                const address = this.server!.address();
                if (address && typeof address === 'object') {
                    this.port = address.port;
                    console.log(`Tracking server started on port ${this.port}`);
                    resolve(this.port);
                } else {
                    reject(new Error('Failed to get server address'));
                }
            });

            this.server.on('error', reject);
        });
    }

    stop(): void {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.port = 0;
        }
    }

    getUrl(): string {
        return `http://localhost:${this.port}`;
    }

    onGesture(callback: GestureCallback): void {
        this.onGestureCallback = callback;
    }

    private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
        const url = req.url || '/';

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        if (url === '/' || url === '/index.html') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(this.getHtml());
        } else if (url === '/api/gesture' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (data.gesture && this.onGestureCallback) {
                        this.onGestureCallback(data.gesture);
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'ok' }));
                } catch (e) {
                    res.writeHead(400);
                    res.end('Invalid JSON');
                }
            });
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    }

    private getHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gesture Code - Hand Tracking</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 700px; margin: 0 auto; }
        h1 { text-align: center; margin-bottom: 10px; font-size: 1.8rem; }
        .subtitle { text-align: center; color: #888; margin-bottom: 20px; font-size: 0.9rem; }
        .connection {
            text-align: center;
            padding: 8px 16px;
            border-radius: 20px;
            margin-bottom: 15px;
            font-size: 0.85rem;
        }
        .connection.connected { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
        .connection.disconnected { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .status {
            text-align: center;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            background: rgba(255,255,255,0.1);
        }
        .status.active { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
        .status.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .video-box {
            position: relative;
            width: 100%;
            aspect-ratio: 4/3;
            background: #000;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        video, canvas {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            object-fit: cover;
        }
        video { transform: scaleX(-1); }
        canvas { transform: scaleX(-1); pointer-events: none; }
        .feedback {
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.85);
            padding: 12px 28px;
            border-radius: 25px;
            font-size: 1.4rem;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .feedback.show { opacity: 1; }
        .command-sent {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(102, 126, 234, 0.9);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .command-sent.show { opacity: 1; }
        .debug-info {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.75rem;
            font-family: monospace;
            max-width: 200px;
        }
        .controls { text-align: center; margin-bottom: 20px; }
        button {
            padding: 15px 45px;
            font-size: 1.1rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(102,126,234,0.4); }
        button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .stats {
            display: flex;
            justify-content: center;
            gap: 25px;
            padding: 15px;
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .stat-label { font-size: 0.75rem; color: #888; }
        .stat-value { font-size: 1.2rem; color: #4ade80; font-weight: bold; }
        .gestures {
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 15px;
        }
        .gestures summary { cursor: pointer; font-weight: bold; margin-bottom: 10px; }
        .gesture-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 10px;
        }
        .gesture-item {
            background: rgba(255,255,255,0.05);
            padding: 10px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .gesture-item.active { background: rgba(102, 126, 234, 0.3); border: 1px solid #667eea; }
        .gesture-icon { font-size: 1.5rem; }
        .gesture-name { font-weight: bold; font-size: 0.85rem; }
        .gesture-action { font-size: 0.7rem; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖐️ Gesture Code</h1>
        <p class="subtitle">Control VS Code with hand gestures</p>
        <div class="connection connected" id="connection">🔗 Connected to VS Code</div>
        <div class="status" id="status">Loading MediaPipe...</div>
        <div class="video-box">
            <video id="video" autoplay playsinline muted></video>
            <canvas id="canvas"></canvas>
            <div class="debug-info" id="debug"></div>
            <div class="feedback" id="feedback"></div>
            <div class="command-sent" id="commandSent">Command sent!</div>
        </div>
        <div class="stats">
            <div><span class="stat-label">FPS</span><br><span class="stat-value" id="fps">0</span></div>
            <div><span class="stat-label">Hand</span><br><span class="stat-value" id="hand">-</span></div>
            <div><span class="stat-label">Gesture</span><br><span class="stat-value" id="gesture">-</span></div>
            <div><span class="stat-label">Confidence</span><br><span class="stat-value" id="confidence">-</span></div>
            <div><span class="stat-label">Commands</span><br><span class="stat-value" id="commands">0</span></div>
        </div>
        <div class="controls">
            <button id="startBtn" disabled>▶️ Start Tracking</button>
        </div>
        <details class="gestures" open>
            <summary>📖 Gesture Guide - VS Code Commands</summary>
            <div class="gesture-grid">
                <div class="gesture-item" id="g_open_palm"><span class="gesture-icon">✋</span><div><div class="gesture-name">Open Palm</div><div class="gesture-action">📜 Scroll Up</div></div></div>
                <div class="gesture-item" id="g_closed_fist"><span class="gesture-icon">👊</span><div><div class="gesture-name">Closed Fist</div><div class="gesture-action">📜 Scroll Down</div></div></div>
                <div class="gesture-item" id="g_pointing_up"><span class="gesture-icon">👆</span><div><div class="gesture-name">Point Up</div><div class="gesture-action">⬆️ Cursor Up</div></div></div>
                <div class="gesture-item" id="g_peace"><span class="gesture-icon">✌️</span><div><div class="gesture-name">Peace Sign</div><div class="gesture-action">💬 Toggle Comment</div></div></div>
                <div class="gesture-item" id="g_thumbs_up"><span class="gesture-icon">👍</span><div><div class="gesture-name">Thumbs Up</div><div class="gesture-action">💾 Save File</div></div></div>
                <div class="gesture-item" id="g_thumbs_down"><span class="gesture-icon">👎</span><div><div class="gesture-name">Thumbs Down</div><div class="gesture-action">❌ Close Tab</div></div></div>
            </div>
        </details>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.min.js"></script>
    <script>
        var video = document.getElementById('video');
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');
        var statusEl = document.getElementById('status');
        var connectionEl = document.getElementById('connection');
        var feedbackEl = document.getElementById('feedback');
        var commandSentEl = document.getElementById('commandSent');
        var debugEl = document.getElementById('debug');
        var fpsEl = document.getElementById('fps');
        var handEl = document.getElementById('hand');
        var gestureEl = document.getElementById('gesture');
        var confidenceEl = document.getElementById('confidence');
        var commandsEl = document.getElementById('commands');
        var startBtn = document.getElementById('startBtn');

        var hands = null;
        var stream = null;
        var isRunning = false;
        var frameCount = 0;
        var lastFpsTime = Date.now();
        var lastGesture = '';
        var lastGestureTime = 0;
        var commandCount = 0;
        var gestureHistory = [];
        var currentHandedness = 'Right';

        var GESTURES = {
            open_palm: { icon: '✋', name: 'Open Palm', action: 'Scroll Up' },
            closed_fist: { icon: '👊', name: 'Closed Fist', action: 'Scroll Down' },
            pointing_up: { icon: '👆', name: 'Point Up', action: 'Cursor Up' },
            peace: { icon: '✌️', name: 'Peace Sign', action: 'Toggle Comment' },
            thumbs_up: { icon: '👍', name: 'Thumbs Up', action: 'Save File' },
            thumbs_down: { icon: '👎', name: 'Thumbs Down', action: 'Close Tab' }
        };

        function sendGestureToVSCode(gesture) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/gesture', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        commandCount++;
                        commandsEl.textContent = commandCount;
                        commandSentEl.textContent = '✓ ' + GESTURES[gesture].action;
                        commandSentEl.classList.add('show');
                        setTimeout(function() { commandSentEl.classList.remove('show'); }, 800);
                    } else {
                        connectionEl.textContent = '⚠️ Connection lost - refresh page';
                        connectionEl.classList.remove('connected');
                        connectionEl.classList.add('disconnected');
                    }
                }
            };
            xhr.onerror = function() {
                connectionEl.textContent = '⚠️ Connection lost - refresh page';
                connectionEl.classList.remove('connected');
                connectionEl.classList.add('disconnected');
            };
            xhr.send(JSON.stringify({ gesture: gesture }));
        }

        function initHands() {
            hands = new Hands({
                locateFile: function(file) { return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/' + file; }
            });
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.8,
                minTrackingConfidence: 0.7
            });
            hands.onResults(onResults);
            hands.initialize().then(function() {
                statusEl.textContent = 'Ready - Click Start to begin';
                startBtn.disabled = false;
            }).catch(function(err) {
                statusEl.textContent = 'Error loading MediaPipe: ' + err.message;
                statusEl.classList.add('error');
            });
        }

        function startCamera() {
            return new Promise(function(resolve) {
                statusEl.textContent = 'Requesting camera access...';
                navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                    audio: false
                }).then(function(s) {
                    stream = s;
                    video.srcObject = stream;
                    video.play().then(function() {
                        canvas.width = video.videoWidth || 640;
                        canvas.height = video.videoHeight || 480;
                        resolve(true);
                    });
                }).catch(function(err) {
                    var msg = 'Camera error: ' + err.message;
                    if (err.name === 'NotAllowedError') {
                        msg = '⚠️ Camera blocked! Allow camera access and refresh.';
                    } else if (err.name === 'NotFoundError') {
                        msg = '⚠️ No camera found.';
                    } else if (err.name === 'NotReadableError') {
                        msg = '⚠️ Camera in use by another app.';
                    }
                    statusEl.textContent = msg;
                    statusEl.classList.add('error');
                    resolve(false);
                });
            });
        }

        function processFrame() {
            if (!isRunning || !hands) return;
            hands.send({ image: video }).then(function() {
                requestAnimationFrame(processFrame);
            }).catch(function() {
                requestAnimationFrame(processFrame);
            });
        }

        function onResults(results) {
            frameCount++;
            var now = Date.now();
            if (now - lastFpsTime >= 1000) {
                fpsEl.textContent = frameCount;
                frameCount = 0;
                lastFpsTime = now;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Clear all gesture highlights
            var gestureItems = document.querySelectorAll('.gesture-item');
            for (var i = 0; i < gestureItems.length; i++) {
                gestureItems[i].classList.remove('active');
            }

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                var landmarks = results.multiHandLandmarks[0];
                var handedness = results.multiHandedness && results.multiHandedness[0];
                
                // MediaPipe returns handedness as if looking at your own hands (mirrored view)
                // Since we mirror the video, we need to flip the label for display
                // But for gesture detection, we use the RAW label from MediaPipe
                var rawLabel = handedness ? handedness.label : 'Right';
                currentHandedness = rawLabel;
                
                // Display is mirrored, so flip the label for user display
                var displayLabel = rawLabel === 'Right' ? 'Left' : 'Right';
                handEl.textContent = displayLabel;
                
                drawHand(landmarks);
                
                // Use raw handedness for gesture recognition
                var result = recognizeGesture(landmarks, rawLabel);
                
                if (result.gesture) {
                    gestureEl.textContent = GESTURES[result.gesture] ? GESTURES[result.gesture].name : result.gesture;
                    confidenceEl.textContent = Math.round(result.confidence * 100) + '%';
                    
                    // Highlight the detected gesture
                    var gestureItem = document.getElementById('g_' + result.gesture);
                    if (gestureItem) gestureItem.classList.add('active');
                    
                    // Debug info
                    debugEl.innerHTML = 'Fingers: ' + result.debug.fingers.join(', ') + '<br>Ext: ' + result.debug.extendedCount;
                    
                    handleGesture(result.gesture, result.confidence);
                } else {
                    gestureEl.textContent = '-';
                    confidenceEl.textContent = '-';
                    debugEl.innerHTML = result.debug ? ('Fingers: ' + result.debug.fingers.join(', ') + '<br>Ext: ' + result.debug.extendedCount) : '';
                }
            } else {
                handEl.textContent = '-';
                gestureEl.textContent = '-';
                confidenceEl.textContent = '-';
                debugEl.innerHTML = '';
            }
        }

        function drawHand(landmarks) {
            var connections = [
                [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
                [0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],
                [0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]
            ];
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 3;
            for (var i = 0; i < connections.length; i++) {
                var c = connections[i];
                ctx.beginPath();
                ctx.moveTo(landmarks[c[0]].x * canvas.width, landmarks[c[0]].y * canvas.height);
                ctx.lineTo(landmarks[c[1]].x * canvas.width, landmarks[c[1]].y * canvas.height);
                ctx.stroke();
            }
            ctx.fillStyle = '#4ade80';
            for (var j = 0; j < landmarks.length; j++) {
                var lm = landmarks[j];
                ctx.beginPath();
                ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        // Improved gesture recognition with handedness awareness
        function recognizeGesture(lm, handedness) {
            // Landmark indices:
            // 0: wrist
            // 1-4: thumb (CMC, MCP, IP, TIP)
            // 5-8: index (MCP, PIP, DIP, TIP)
            // 9-12: middle
            // 13-16: ring
            // 17-20: pinky

            var wrist = lm[0];
            var thumbTip = lm[4];
            var thumbIP = lm[3];
            var thumbMCP = lm[2];
            var thumbCMC = lm[1];
            var indexTip = lm[8];
            var indexPIP = lm[6];
            var indexMCP = lm[5];
            var middleTip = lm[12];
            var middlePIP = lm[10];
            var middleMCP = lm[9];
            var ringTip = lm[16];
            var ringPIP = lm[14];
            var ringMCP = lm[13];
            var pinkyTip = lm[20];
            var pinkyPIP = lm[18];
            var pinkyMCP = lm[17];

            // Calculate distances and angles for better detection
            function dist(a, b) {
                return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow((a.z || 0) - (b.z || 0), 2));
            }

            // Palm size for normalization
            var palmSize = dist(wrist, middleMCP);

            // Check if each finger is extended using multiple criteria
            var fingers = [];

            // THUMB: Check based on handedness
            // For right hand (raw label), thumb extends to the LEFT (lower x in non-mirrored coordinates)
            // For left hand (raw label), thumb extends to the RIGHT (higher x)
            var thumbExtended;
            if (handedness === 'Right') {
                // Right hand: thumb tip should be to the LEFT of thumb IP (lower x)
                thumbExtended = thumbTip.x < thumbIP.x - 0.02;
            } else {
                // Left hand: thumb tip should be to the RIGHT of thumb IP (higher x)
                thumbExtended = thumbTip.x > thumbIP.x + 0.02;
            }
            // Also check thumb is away from palm
            var thumbAwayFromPalm = dist(thumbTip, indexMCP) > palmSize * 0.5;
            fingers[0] = thumbExtended && thumbAwayFromPalm;

            // INDEX: tip above PIP (lower y = higher on screen)
            var indexExtended = indexTip.y < indexPIP.y - 0.03 && indexTip.y < indexMCP.y;
            fingers[1] = indexExtended;

            // MIDDLE: tip above PIP
            var middleExtended = middleTip.y < middlePIP.y - 0.03 && middleTip.y < middleMCP.y;
            fingers[2] = middleExtended;

            // RING: tip above PIP
            var ringExtended = ringTip.y < ringPIP.y - 0.03 && ringTip.y < ringMCP.y;
            fingers[3] = ringExtended;

            // PINKY: tip above PIP
            var pinkyExtended = pinkyTip.y < pinkyPIP.y - 0.03 && pinkyTip.y < pinkyMCP.y;
            fingers[4] = pinkyExtended;

            var extendedCount = 0;
            for (var i = 0; i < fingers.length; i++) {
                if (fingers[i]) extendedCount++;
            }

            var debug = {
                fingers: fingers.map(function(f) { return f ? '1' : '0'; }),
                extendedCount: extendedCount
            };

            // GESTURE DETECTION with confidence scores

            // OPEN PALM: All 5 fingers extended
            if (extendedCount >= 4 && fingers[1] && fingers[2] && fingers[3]) {
                // Check fingers are spread out
                var spread = dist(indexTip, pinkyTip) > palmSize * 0.8;
                if (spread) {
                    return { gesture: 'open_palm', confidence: 0.9 + (extendedCount === 5 ? 0.1 : 0), debug: debug };
                }
            }

            // CLOSED FIST: No fingers extended, hand is closed
            if (extendedCount === 0) {
                // Verify all fingertips are close to palm/wrist
                var allCurled = dist(indexTip, wrist) < palmSize * 1.2 &&
                               dist(middleTip, wrist) < palmSize * 1.2 &&
                               dist(ringTip, wrist) < palmSize * 1.2 &&
                               dist(pinkyTip, wrist) < palmSize * 1.2;
                if (allCurled) {
                    return { gesture: 'closed_fist', confidence: 0.95, debug: debug };
                }
            }

            // THUMBS UP: Only thumb extended, thumb pointing up
            if (fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
                // Thumb should be pointing UP (thumb tip y < thumb CMC y)
                var thumbUp = thumbTip.y < thumbCMC.y - 0.08;
                // Thumb should be above wrist
                var thumbAboveWrist = thumbTip.y < wrist.y - 0.05;
                if (thumbUp && thumbAboveWrist) {
                    return { gesture: 'thumbs_up', confidence: 0.95, debug: debug };
                }
            }

            // THUMBS DOWN: Only thumb extended, thumb pointing down
            if (fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
                // Thumb should be pointing DOWN
                var thumbDown = thumbTip.y > thumbCMC.y + 0.05;
                if (thumbDown) {
                    return { gesture: 'thumbs_down', confidence: 0.9, debug: debug };
                }
            }

            // POINTING UP: Only index finger extended
            if (fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
                // Index should be pointing UP
                var indexUp = indexTip.y < indexMCP.y - 0.1;
                // Index significantly above other fingers
                var indexHighest = indexTip.y < middleTip.y && indexTip.y < ringTip.y;
                if (indexUp && indexHighest) {
                    return { gesture: 'pointing_up', confidence: 0.9, debug: debug };
                }
            }

            // PEACE SIGN: Index and middle extended, others closed
            if (fingers[1] && fingers[2] && !fingers[3] && !fingers[4]) {
                // Check V shape - index and middle should be spread apart
                var vSpread = dist(indexTip, middleTip) > palmSize * 0.3;
                // Both pointing up
                var bothUp = indexTip.y < indexMCP.y - 0.05 && middleTip.y < middleMCP.y - 0.05;
                if (vSpread && bothUp) {
                    return { gesture: 'peace', confidence: 0.9, debug: debug };
                }
            }

            return { gesture: null, confidence: 0, debug: debug };
        }

        function handleGesture(gesture, confidence) {
            var now = Date.now();
            
            // Add to history for stabilization
            gestureHistory.push({ gesture: gesture, time: now, confidence: confidence });
            
            // Keep only last 500ms of history
            gestureHistory = gestureHistory.filter(function(h) { return now - h.time < 500; });
            
            // Count gesture occurrences in history
            var counts = {};
            for (var i = 0; i < gestureHistory.length; i++) {
                var g = gestureHistory[i].gesture;
                counts[g] = (counts[g] || 0) + 1;
            }
            
            // Find most common gesture (must appear in at least 3 frames)
            var stableGesture = null;
            var maxCount = 0;
            for (var key in counts) {
                if (counts[key] > maxCount && counts[key] >= 3) {
                    maxCount = counts[key];
                    stableGesture = key;
                }
            }
            
            if (!stableGesture) return;
            
            // Cooldown check
            if (stableGesture === lastGesture && now - lastGestureTime < 1500) return;
            if (now - lastGestureTime < 600) return;
            
            lastGesture = stableGesture;
            lastGestureTime = now;
            gestureHistory = []; // Clear history after triggering
            
            var g = GESTURES[stableGesture];
            if (g) {
                feedbackEl.textContent = g.icon + ' ' + g.name;
                feedbackEl.classList.add('show');
                setTimeout(function() { feedbackEl.classList.remove('show'); }, 1000);
                
                sendGestureToVSCode(stableGesture);
            }
        }

        function toggle() {
            if (isRunning) {
                isRunning = false;
                if (stream) {
                    var tracks = stream.getTracks();
                    for (var i = 0; i < tracks.length; i++) {
                        tracks[i].stop();
                    }
                    stream = null;
                }
                video.srcObject = null;
                statusEl.textContent = 'Stopped';
                statusEl.classList.remove('active');
                statusEl.classList.remove('error');
                startBtn.textContent = '▶️ Start Tracking';
            } else {
                statusEl.classList.remove('error');
                startCamera().then(function(ok) {
                    if (ok) {
                        isRunning = true;
                        statusEl.textContent = '🟢 Tracking Active - Make gestures!';
                        statusEl.classList.add('active');
                        startBtn.textContent = '⏹️ Stop Tracking';
                        processFrame();
                    }
                });
            }
        }

        startBtn.onclick = toggle;
        initHands();
    </script>
</body>
</html>`;
    }
}
