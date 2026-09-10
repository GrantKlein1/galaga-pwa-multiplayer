(function () {
  var ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var PREFIX = "galaga-";
  var JOIN_MS = 18000;
  var TURN_MS = 1500;
  var WEBRTC_RETRY_MS = 8000;
  var MQTT_BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt",
    "wss://test.mosquitto.org:8081/mqtt"
  ];
  var ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:stun.relay.metered.ca:80" }
  ];

  var peer = null;
  var conn = null;
  var gameDc = null;
  var role = null;
  var code = "";
  var handlers = {};
  var closed = false;
  var joinTimer = 0;
  var openedOnce = false;
  var suppressClose = false;
  var transport = null;
  var mqttSocks = [];
  var mqttLive = null;
  var mqttPingTimer = 0;
  var mqttHsTimer = 0;
  var pktId = 1;
  var turnServers = [];
  var webrtcRetryTimer = 0;
  var lastWebrtcTry = 0;
  var pingTimer = 0;
  var statsTimer = 0;
  var lastRtt = 0;
  var icePath = "";
  var iceRtt = 0;

  function peerOpts() {
    return {
      host: "0.peerjs.com",
      port: 443,
      secure: true,
      path: "/",
      debug: 0,
      pingInterval: 4000,
      config: {
        iceServers: iceList(),
        sdpSemantics: "unified-plan",
        iceCandidatePoolSize: 4,
        iceTransportPolicy: "all"
      }
    };
  }

  function iceList() {
    var list = ICE_SERVERS.slice();
    var i;
    for (i = 0; i < turnServers.length; i++) list.push(turnServers[i]);
    return list;
  }

  function filterIce(list) {
    var out = [], i, one, urls, j, u, ok, entry;
    if (!list || !list.length) return out;
    for (i = 0; i < list.length; i++) {
      one = list[i];
      if (!one) continue;
      urls = Array.isArray(one.urls) ? one.urls : [one.urls];
      ok = [];
      for (j = 0; j < urls.length; j++) {
        u = String(urls[j] || "");
        if (!u) continue;
        if (u.indexOf("transport=tcp") >= 0) continue;
        ok.push(u);
      }
      if (!ok.length) continue;
      entry = { urls: ok.length === 1 ? ok[0] : ok };
      if (one.username) entry.username = one.username;
      if (one.credential) entry.credential = one.credential;
      out.push(entry);
    }
    return out;
  }

  function fetchTurn(cb) {
    var done = false;
    var t = setTimeout(function () { finish([]); }, TURN_MS);
    function finish(servers) {
      if (done) return;
      done = true;
      clearTimeout(t);
      cb(filterIce(servers) || []);
    }
    try {
      fetch("/api/turn", { cache: "no-store" }).then(function (res) {
        if (!res.ok) { finish([]); return null; }
        return res.json();
      }).then(function (data) {
        if (!data) return;
        if (Array.isArray(data.iceServers)) finish(data.iceServers);
        else if (Array.isArray(data)) finish(data);
        else finish([]);
      }).catch(function () { finish([]); });
    } catch (err) {
      finish([]);
    }
  }

  function emit(type, data) {
    var fns = handlers[type] || [];
    var i;
    for (i = 0; i < fns.length; i++) {
      try { fns[i](data); } catch (err) {}
    }
    var any = handlers["*"] || [];
    for (i = 0; i < any.length; i++) {
      try { any[i](type, data); } catch (err) {}
    }
  }

  function randCode() {
    var i, s = "";
    for (i = 0; i < 4; i++) s += ALPHA.charAt(Math.floor(Math.random() * ALPHA.length));
    return s;
  }

  function normalizeCode(raw) {
    return String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  }

  function topicFor(side) {
    return "galagaPwa/" + code + "/" + side;
  }

  function clearJoinTimer() {
    if (joinTimer) { clearTimeout(joinTimer); joinTimer = 0; }
  }

  function clearMqttTimers() {
    if (mqttPingTimer) { clearInterval(mqttPingTimer); mqttPingTimer = 0; }
    if (mqttHsTimer) { clearInterval(mqttHsTimer); mqttHsTimer = 0; }
  }

  function clearNetTimers() {
    if (webrtcRetryTimer) { clearInterval(webrtcRetryTimer); webrtcRetryTimer = 0; }
    if (pingTimer) { clearInterval(pingTimer); pingTimer = 0; }
    if (statsTimer) { clearInterval(statsTimer); statsTimer = 0; }
  }

  function nextPktId() {
    pktId += 1;
    if (pktId > 65535) pktId = 1;
    return pktId;
  }

  function concatBytes(parts) {
    var n = 0, i, o = 0, out;
    for (i = 0; i < parts.length; i++) n += parts[i].length;
    out = new Uint8Array(n);
    for (i = 0; i < parts.length; i++) {
      out.set(parts[i], o);
      o += parts[i].length;
    }
    return out;
  }

  function mqttStr(str) {
    var b = new TextEncoder().encode(str);
    var out = new Uint8Array(2 + b.length);
    out[0] = (b.length >> 8) & 255;
    out[1] = b.length & 255;
    out.set(b, 2);
    return out;
  }

  function remainBytes(n) {
    var bytes = [];
    do {
      var d = n % 128;
      n = Math.floor(n / 128);
      if (n > 0) d |= 128;
      bytes.push(d);
    } while (n > 0);
    return new Uint8Array(bytes);
  }

  function mqttPacket(typeFlags, payload) {
    return concatBytes([new Uint8Array([typeFlags]), remainBytes(payload.length), payload]);
  }

  function connectPacket(cid) {
    return mqttPacket(0x10, concatBytes([mqttStr("MQTT"), new Uint8Array([4, 2, 0, 20]), mqttStr(cid)]));
  }

  function subscribePacket(topic) {
    var id = nextPktId();
    return mqttPacket(0x82, concatBytes([
      new Uint8Array([id >> 8, id & 255]),
      mqttStr(topic),
      new Uint8Array([0])
    ]));
  }

  function publishPacket(topic, payloadU8) {
    return mqttPacket(0x30, concatBytes([mqttStr(topic), payloadU8]));
  }

  function pingPacket() {
    return new Uint8Array([0xc0, 0]);
  }

  function readRemain(buf, i) {
    var n = 0, mul = 1, c;
    do {
      if (i >= buf.length) return null;
      c = buf[i];
      i += 1;
      n += (c & 127) * mul;
      mul *= 128;
    } while (c & 128);
    return { n: n, i: i };
  }

  function parseMqttFrames(sock, raw) {
    var incoming = new Uint8Array(raw);
    var buf = new Uint8Array(sock.buf.length + incoming.length);
    buf.set(sock.buf, 0);
    buf.set(incoming, sock.buf.length);
    sock.buf = buf;
    while (sock.buf.length >= 2) {
      var remaining = readRemain(sock.buf, 1);
      if (!remaining) break;
      var need = remaining.i + remaining.n;
      if (sock.buf.length < need) break;
      var pkt = sock.buf.slice(0, need);
      sock.buf = sock.buf.slice(need);
      handleMqttPacket(sock, pkt, remaining.i, remaining.n);
    }
  }

  function decodePayload(bytes) {
    var msg, text;
    if (bytes && bytes.length && window.__netcodec && window.__netcodec.isBinaryFrame(bytes)) {
      try { return window.__netcodec.decode(bytes); } catch (err) { return null; }
    }
    try { text = new TextDecoder().decode(bytes); } catch (err) { return null; }
    try { msg = JSON.parse(text); } catch (err) { return null; }
    return msg;
  }

  function handleMqttPacket(sock, pkt, hdrEnd, len) {
    var type = pkt[0] >> 4;
    var qos, i, tlen, payload, msg;
    if (type === 2) {
      sock.connected = pkt[hdrEnd + 1] === 0;
      if (sock.connected && sock.onOpen) sock.onOpen();
      return;
    }
    if (type === 9) {
      sock.subReady = true;
      if (sock.onSub) sock.onSub();
      return;
    }
    if (type === 3) {
      qos = (pkt[0] >> 1) & 3;
      i = hdrEnd;
      tlen = (pkt[i] << 8) | pkt[i + 1];
      i += 2;
      i += tlen;
      if (qos > 0) i += 2;
      payload = pkt.slice(i, hdrEnd + len);
      msg = decodePayload(payload);
      if (msg) onMqttMsg(sock, msg);
    }
  }

  function closeMqttSock(sock) {
    sock.dead = true;
    try { sock.ws.close(); } catch (err) {}
  }

  function openMqtt(url, cid, onReady) {
    var sock = {
      url: url,
      ws: null,
      buf: new Uint8Array(0),
      connected: false,
      subReady: false,
      dead: false,
      onOpen: null,
      onSub: null
    };
    var ws;
    try {
      ws = new WebSocket(url, ["mqtt"]);
    } catch (err) {
      return null;
    }
    sock.ws = ws;
    mqttSocks.push(sock);
    ws.binaryType = "arraybuffer";
    ws.onopen = function () {
      if (closed || sock.dead) return;
      try { ws.send(connectPacket(cid)); } catch (err) {}
    };
    ws.onmessage = function (ev) {
      if (closed || sock.dead) return;
      parseMqttFrames(sock, ev.data);
    };
    ws.onclose = function () {
      if (closed || suppressClose || sock.dead) return;
      if (mqttLive === sock && openedOnce && transport === "mqtt") emit("close", { reason: "mqtt-closed" });
    };
    ws.onerror = function () {};
    sock.onOpen = function () {
      if (closed || sock.dead) return;
      try { ws.send(subscribePacket(sock.subTopic)); } catch (err) {}
    };
    sock.onSub = function () {
      if (closed || sock.dead) return;
      if (onReady) onReady(sock);
    };
    setTimeout(function () {
      if (sock.connected || sock.dead || closed) return;
      closeMqttSock(sock);
    }, 6000);
    return sock;
  }

  function toU8(obj) {
    if (obj instanceof Uint8Array) return obj;
    if (obj instanceof ArrayBuffer) return new Uint8Array(obj);
    if (ArrayBuffer.isView(obj)) return new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength);
    return new TextEncoder().encode(JSON.stringify(obj));
  }

  function mqttPublish(sock, topic, obj) {
    if (!sock || sock.dead || !sock.ws || sock.ws.readyState !== 1) return false;
    try {
      sock.ws.send(publishPacket(topic, toU8(obj)));
      return true;
    } catch (err) {
      return false;
    }
  }

  function startMqttKeepalive(sock) {
    clearMqttTimers();
    mqttPingTimer = setInterval(function () {
      if (!sock || sock.dead || !sock.ws || sock.ws.readyState !== 1) return;
      try { sock.ws.send(pingPacket()); } catch (err) {}
    }, 15000);
  }

  function startWebrtcRetry() {
    if (webrtcRetryTimer || closed || transport === "webrtc") return;
    webrtcRetryTimer = setInterval(function () {
      if (closed || transport === "webrtc") {
        if (webrtcRetryTimer) { clearInterval(webrtcRetryTimer); webrtcRetryTimer = 0; }
        return;
      }
      retryWebrtc();
    }, WEBRTC_RETRY_MS);
  }

  function retryWebrtc() {
    if (closed || transport === "webrtc") return;
    lastWebrtcTry = Date.now();
    destroyPeer();
    if (role === "host") startWebrtcHost();
    else startWebrtcJoin();
  }

  function adoptMqtt(sock) {
    if (closed || transport === "webrtc") return;
    if (transport === "mqtt") return;
    transport = "mqtt";
    mqttLive = sock;
    startMqttKeepalive(sock);
    var i, s;
    for (i = 0; i < mqttSocks.length; i++) {
      s = mqttSocks[i];
      if (s !== sock) closeMqttSock(s);
    }
    markConnected();
    startPing();
    startWebrtcRetry();
    emit("transport", stats());
  }

  function onMqttMsg(sock, msg) {
    if (!msg || typeof msg !== "object") return;
    if (msg.t === "netping") {
      mqttPublish(sock, sock.pubTopic, { t: "netpong" });
      if (role === "host") adoptMqtt(sock);
      return;
    }
    if (msg.t === "netpong") {
      if (role === "client") adoptMqtt(sock);
      return;
    }
    if (handleRtt(msg)) return;
    if (transport === "webrtc") return;
    if (mqttLive && sock !== mqttLive) return;
    emit(msg.t || "data", msg);
  }

  function startMqttSession() {
    var i, cid, sock, sub, pub;
    sub = role === "host" ? "h" : "c";
    pub = role === "host" ? "c" : "h";
    for (i = 0; i < MQTT_BROKERS.length; i++) {
      cid = "g" + role.charAt(0) + code + Math.random().toString(36).slice(2, 6);
      sock = openMqtt(MQTT_BROKERS[i], cid, role === "client" ? null : function (readySock) {
        if (role === "host" && !transport) mqttLive = readySock;
      });
      if (!sock) continue;
      sock.subTopic = topicFor(sub);
      sock.pubTopic = topicFor(pub);
    }
    if (role === "client") {
      mqttHsTimer = setInterval(function () {
        if (closed || transport === "webrtc") {
          clearMqttTimers();
          return;
        }
        var j, s;
        for (j = 0; j < mqttSocks.length; j++) {
          s = mqttSocks[j];
          if (s.subReady) mqttPublish(s, s.pubTopic, { t: "netping" });
        }
      }, 400);
    }
  }

  function closeGameDc() {
    var dc = gameDc;
    gameDc = null;
    if (dc) {
      try { dc.close(); } catch (err) {}
    }
  }

  function parseIncoming(raw) {
    var text, msg, u8;
    if (raw instanceof ArrayBuffer || ArrayBuffer.isView(raw)) {
      u8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
      if (window.__netcodec && window.__netcodec.isBinaryFrame(u8)) {
        try { return window.__netcodec.decode(u8); } catch (err) { return null; }
      }
      try { text = new TextDecoder().decode(u8); } catch (err) { return null; }
      try { return JSON.parse(text); } catch (err) { return null; }
    }
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch (err) { return null; }
    }
    if (raw && typeof raw === "object") return raw;
    return null;
  }

  function bindGameDc(dc) {
    if (!dc) return;
    gameDc = dc;
    try { dc.binaryType = "arraybuffer"; } catch (err) {}
    dc.onmessage = function (ev) {
      var msg = parseIncoming(ev.data);
      if (!msg || typeof msg !== "object") return;
      if (handleRtt(msg)) return;
      emit(msg.t || "data", msg);
    };
    dc.onopen = function () {
      sendPing();
    };
  }

  function listenGameDc(c) {
    var pc = c && c.peerConnection;
    if (!pc || c._galagaGameListen) return;
    c._galagaGameListen = true;
    pc.addEventListener("datachannel", function (ev) {
      if (ev.channel && ev.channel.label === "game") bindGameDc(ev.channel);
    });
  }

  function createGameDc(c) {
    var pc = c && c.peerConnection;
    if (!pc || gameDc) return false;
    try {
      bindGameDc(pc.createDataChannel("game", { ordered: false, maxRetransmits: 0 }));
      return true;
    } catch (err) {
      return false;
    }
  }

  function ensureGameDc(c) {
    listenGameDc(c);
    if (role !== "client") return;
    if (createGameDc(c)) return;
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if (closed || gameDc || n > 40) {
        clearInterval(t);
        return;
      }
      createGameDc(c);
    }, 50);
  }

  function destroyPeer() {
    var p = peer;
    var c = conn;
    suppressClose = true;
    peer = null;
    conn = null;
    closeGameDc();
    if (c) {
      try { c.close(); } catch (err) {}
    }
    if (p) {
      try { p.destroy(); } catch (err) {}
    }
    suppressClose = false;
  }

  function destroyMqtt() {
    var i;
    clearMqttTimers();
    for (i = 0; i < mqttSocks.length; i++) closeMqttSock(mqttSocks[i]);
    mqttSocks = [];
    mqttLive = null;
  }

  function destroyAll() {
    clearJoinTimer();
    clearNetTimers();
    destroyMqtt();
    destroyPeer();
    openedOnce = false;
    transport = null;
    lastRtt = 0;
    icePath = "";
    iceRtt = 0;
    turnServers = [];
  }

  function fail(message, fatal) {
    emit("error", { message: message || "Connection failed" });
    if (fatal) {
      closed = true;
      role = null;
      code = "";
      destroyAll();
      emit("close", { reason: message || "error" });
    }
  }

  function markConnected() {
    if (openedOnce || closed) return;
    openedOnce = true;
    clearJoinTimer();
    if (transport === "webrtc") clearMqttTimers();
    emit("connected", { role: role, code: code, transport: transport, path: pathLabel() });
  }

  function dropStaleConn(next) {
    var prev = conn;
    if (prev && prev !== next) {
      try { prev.close(); } catch (err) {}
    }
    conn = next;
  }

  function adoptWebrtc(c) {
    var upgraded = transport === "mqtt";
    if (closed) return;
    transport = "webrtc";
    if (webrtcRetryTimer) { clearInterval(webrtcRetryTimer); webrtcRetryTimer = 0; }
    destroyMqtt();
    markConnected();
    ensureGameDc(c);
    startPing();
    startStats();
    sampleIce();
    if (upgraded) emit("transport", stats());
  }

  function wireConn(c) {
    if (conn && conn !== c && conn.open && transport === "webrtc") {
      try { c.close(); } catch (err) {}
      return;
    }
    dropStaleConn(c);
    listenGameDc(c);
    c.on("data", function (msg) {
      var parsed = msg;
      if (typeof msg !== "object" || (msg && msg.byteLength)) parsed = parseIncoming(msg);
      if (!parsed || typeof parsed !== "object") return;
      if (handleRtt(parsed)) return;
      emit(parsed.t || "data", parsed);
    });
    c.on("open", function () {
      if (closed) return;
      adoptWebrtc(c);
    });
    c.on("close", function () {
      if (closed || suppressClose) return;
      if (conn === c) conn = null;
      if (!openedOnce || transport !== "webrtc") return;
      emit("close", { reason: "peer-closed" });
    });
    c.on("error", function () {
      if (closed || suppressClose) return;
      if (!openedOnce || transport !== "webrtc") return;
      fail("Connection error", false);
    });
    if (c.open) adoptWebrtc(c);
  }

  function makePeer(id, onOpen) {
    var p;
    try {
      p = id ? new Peer(id, peerOpts()) : new Peer(peerOpts());
    } catch (err) {
      return null;
    }
    peer = p;
    p.on("open", function (openId) {
      if (closed || peer !== p) return;
      if (onOpen) onOpen(openId);
    });
    p.on("error", function (err) {
      if (closed || peer !== p) return;
      var type = err && err.type;
      if (type === "unavailable-id") return;
      if (type === "peer-unavailable") return;
      if (type === "network" || type === "server-error" || type === "socket-error" || type === "socket-closed") return;
    });
    p.on("disconnected", function () {
      if (closed || peer !== p || !peer) return;
      try { peer.reconnect(); } catch (err) {}
    });
    return p;
  }

  function startWebrtcHost() {
    lastWebrtcTry = Date.now();
    makePeer(PREFIX + code, null);
    if (peer) {
      peer.on("connection", function (c) {
        if (conn && conn.open && transport === "webrtc") {
          try { c.close(); } catch (err) {}
          return;
        }
        c.serialization = "json";
        wireConn(c);
      });
    }
  }

  function startWebrtcJoin() {
    lastWebrtcTry = Date.now();
    makePeer(null, function () {
      if (closed || !peer || transport === "webrtc") return;
      var c = peer.connect(PREFIX + code, { serialization: "json", reliable: true });
      wireConn(c);
      ensureGameDc(c);
    });
  }

  function beginSession() {
    startMqttSession();
    fetchTurn(function (servers) {
      if (closed) return;
      turnServers = servers;
      if (role === "host") startWebrtcHost();
      else startWebrtcJoin();
    });
  }

  function host(onReady) {
    close();
    closed = false;
    role = "host";
    openedOnce = false;
    transport = null;
    code = randCode();
    if (onReady) {
      var once = function (info) {
        off("ready", once);
        onReady(info.code);
      };
      on("ready", once);
    }
    emit("ready", { code: code, role: "host" });
    beginSession();
  }

  function join(raw) {
    var want = normalizeCode(raw);
    if (want.length !== 4) {
      fail("Enter a 4-letter code", true);
      return;
    }
    close();
    closed = false;
    role = "client";
    code = want;
    openedOnce = false;
    transport = null;
    emit("error", { message: "Connecting… this can take a few seconds", retrying: true });
    beginSession();
    clearJoinTimer();
    joinTimer = setTimeout(function () {
      if (closed || openedOnce) return;
      fail("Could not reach host. Both stay on this game with internet, host keeps the code screen open, then tap Join again.", true);
    }, JOIN_MS);
  }

  function isUnreliableMsg(msg) {
    return msg && (msg.t === "snap" || msg.t === "input" || msg.t === "rtt" || msg.t === "rttp");
  }

  function encodeOutgoing(msg) {
    if (msg && msg.t === "snap" && window.__netcodec) {
      try { return window.__netcodec.encodeSnap(msg.n, msg.s); } catch (err) { return msg; }
    }
    return msg;
  }

  function sendRaw(payload) {
    if (gameDc && gameDc.readyState === "open") {
      try {
        if (payload instanceof Uint8Array) gameDc.send(payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength));
        else if (payload instanceof ArrayBuffer) gameDc.send(payload);
        else gameDc.send(JSON.stringify(payload));
        return true;
      } catch (err) {}
    }
    return false;
  }

  function sendUnreliable(msg) {
    return sendRaw(encodeOutgoing(msg));
  }

  function send(msg) {
    var payload;
    if (!msg || !openedOnce) return false;
    payload = encodeOutgoing(msg);
    if (transport === "webrtc" && (payload instanceof Uint8Array || isUnreliableMsg(msg)) && sendRaw(payload)) return true;
    if (transport === "mqtt") return mqttPublish(mqttLive, mqttLive && mqttLive.pubTopic, payload);
    if (conn && conn.open) {
      try { conn.send(msg); return true; } catch (err) { return false; }
    }
    return false;
  }

  function handleRtt(msg) {
    if (!msg || typeof msg !== "object") return false;
    if (msg.t === "rtt") {
      send({ t: "rttp", t0: msg.t0 });
      return true;
    }
    if (msg.t === "rttp") {
      lastRtt = Math.max(0, Math.round(performance.now() - (msg.t0 || 0)));
      return true;
    }
    return false;
  }

  function sendPing() {
    if (!openedOnce || closed) return;
    send({ t: "rtt", t0: performance.now() });
  }

  function startPing() {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(sendPing, 1000);
    sendPing();
  }

  function pathLabel() {
    if (transport === "mqtt") return "mqtt";
    if (transport === "webrtc") return icePath === "relay" ? "relay" : "p2p";
    return "";
  }

  function sampleIce() {
    var pc = conn && conn.peerConnection;
    if (!pc || !pc.getStats) return;
    pc.getStats().then(function (report) {
      var picked = null;
      report.forEach(function (row) {
        if (row.type !== "candidate-pair") return;
        if (row.state && row.state !== "succeeded") return;
        if (row.nominated || row.selected || row.state === "succeeded") {
          if (!picked || row.nominated) picked = row;
        }
      });
      if (!picked) return;
      if (typeof picked.currentRoundTripTime === "number") {
        iceRtt = Math.round(picked.currentRoundTripTime * 1000);
      }
      var local = picked.localCandidateId ? report.get(picked.localCandidateId) : null;
      if (local && (local.candidateType || local.type)) icePath = local.candidateType || local.type;
    }).catch(function () {});
  }

  function startStats() {
    if (statsTimer) clearInterval(statsTimer);
    statsTimer = setInterval(sampleIce, 2000);
  }

  function stats() {
    var rtt = lastRtt || iceRtt || 0;
    return {
      transport: transport,
      rtt: rtt,
      path: pathLabel(),
      ice: icePath
    };
  }

  function on(type, fn) {
    if (!handlers[type]) handlers[type] = [];
    handlers[type].push(fn);
  }

  function off(type, fn) {
    var list = handlers[type];
    if (!list) return;
    handlers[type] = list.filter(function (f) { return f !== fn; });
  }

  function close() {
    if (openedOnce) {
      try { send({ t: "bye" }); } catch (err) {}
    }
    closed = true;
    role = null;
    code = "";
    destroyAll();
  }

  window.__net = {
    host: host,
    join: join,
    send: send,
    on: on,
    off: off,
    close: close,
    isHost: function () { return role === "host"; },
    isConnected: function () { return !!(openedOnce && (transport === "mqtt" ? mqttLive : conn && conn.open)); },
    role: function () { return role; },
    code: function () { return code; },
    transport: function () { return transport; },
    stats: stats
  };
})();
