const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const { normalizeGestureType, getGestureMapping } = require('../out/gestures/mappings');
const { TrackingServer } = require('../out/server/trackingServer');

function request(url, method = 'GET', body, origin) {
    return new Promise((resolve, reject) => {
        const requestUrl = new URL(url);
        const request = http.request({
            hostname: requestUrl.hostname,
            port: requestUrl.port,
            path: requestUrl.pathname,
            method,
            headers: {
                ...(body ? { 'Content-Type': 'application/json' } : {}),
                Origin: origin ?? requestUrl.origin
            }
        }, response => {
            let responseBody = '';
            response.setEncoding('utf8');
            response.on('data', chunk => { responseBody += chunk; });
            response.on('end', () => resolve({ status: response.statusCode, body: responseBody }));
        });
        request.on('error', reject);
        request.end(body ? JSON.stringify(body) : undefined);
    });
}

test('normalizes active detector names to shared mapping keys', () => {
    assert.equal(normalizeGestureType('pointing_up'), 'point_up');
    assert.equal(normalizeGestureType('peace'), 'peace_sign');
    assert.equal(normalizeGestureType('thumbs_up'), 'thumbs_up');
    assert.equal(normalizeGestureType('unknown'), undefined);
    assert.equal(getGestureMapping(normalizeGestureType('pointing_up')).command, 'cursorUp');
});

test('serves configured tracking options and canonical gesture names', async t => {
    const server = new TrackingServer({ sensitivity: 0.4, showOverlay: false, gestureCooldown: 900 });
    await server.start();
    t.after(() => server.stop());

    const response = await request(server.getUrl());
    assert.equal(response.status, 200);
    assert.match(response.body, /"sensitivity":0\.4,"showOverlay":false,"gestureCooldown":900/);
    assert.match(response.body, /point_up: \{ icon:/);
    assert.match(response.body, /peace_sign: \{ icon:/);
    assert.match(response.body, /minDetectionConfidence: CONFIG\.sensitivity/);
    assert.match(response.body, /now - lastGestureTime < CONFIG\.gestureCooldown/);
});

test('forwards posted gestures to the extension callback', async t => {
    const server = new TrackingServer();
    let receivedGesture;
    server.onGesture(gesture => { receivedGesture = gesture; });
    await server.start();
    t.after(() => server.stop());

    const response = await request(`${server.getUrl()}/api/gesture`, 'POST', { gesture: 'point_up' });
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(response.body), { status: 'ok' });
    assert.equal(receivedGesture, 'point_up');
});

test('rejects gesture requests from a foreign origin', async t => {
    const server = new TrackingServer();
    let receivedGesture;
    server.onGesture(gesture => { receivedGesture = gesture; });
    await server.start();
    t.after(() => server.stop());

    const response = await request(
        `${server.getUrl()}/api/gesture`,
        'POST',
        { gesture: 'thumbs_up' },
        'https://untrusted.example'
    );
    assert.equal(response.status, 403);
    assert.equal(receivedGesture, undefined);
});