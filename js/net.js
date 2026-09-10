(function () {
  var ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var PREFIX = "galaga-";
  var JOIN_MS = 18000;
  var MQTT_BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt",
    "wss://test.mosquitto.org:8081/mqtt"
  ];
  var ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:stun.relay.metered.ca:80" },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:80?transport=tcp",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
        "turns:openrelay.metered.ca:443?transport=tcp"
      ],
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ];

  var peer = null;
  var conn = null;
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

  function peerOpts() {
    return {
      host: "0.peerjs.com",
      port: 443,
      secure: true,
      path: "/",
      debug: 0,
      pingInterval: 4000,
      config: {
        iceServers: ICE_SERVERS,
        sdpSemantics: "unified-plan",
        iceCandidatePoolSize: 4
      }
    };
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

  function publishPacket(topic, text) {
    return mqttPacket(0x30, concatBytes([mqttStr(topic), new TextEncoder().encode(text)]));
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
      var rem = readRemain(sock.buf, 1);
      if (!rem) break;
      var need = rem.i + rem.n;
      if (sock.buf.length < need) break;
      var pkt = sock.buf.slice(0, need);
      sock.buf = sock.buf.slice(need);
      handleMqttPacket(sock, pkt, rem.i, rem.n);
    }
  }

  function handleMqttPacket(sock, pkt, hdrEnd, len) {
    var type = pkt[0] >> 4;
    var qos, i, tlen, topic, payload, msg;
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
      topic = new TextDecoder().decode(pkt.slice(i, i + tlen));
      i += tlen;
      if (qos > 0) i += 2;
      payload = new TextDecoder().decode(pkt.slice(i, hdrEnd + len));
      try { msg = JSON.parse(payload); } catch (err) { return; }
      onMqttMsg(sock, topic, msg);
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
      if (mqttLive === sock && openedOnce) emit("close", { reason: "mqtt-closed" });
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

  function mqttPublish(sock, topic, obj) {
    if (!sock || sock.dead || !sock.ws || sock.ws.readyState !== 1) return false;
    try {
      sock.ws.send(publishPacket(topic, JSON.stringify(obj)));
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

  function adoptMqtt(sock) {
    if (transport || closed) return;
    transport = "mqtt";
    mqttLive = sock;
    startMqttKeepalive(sock);
    var i, s;
    for (i = 0; i < mqttSocks.length; i++) {
      s = mqttSocks[i];
      if (s !== sock) closeMqttSock(s);
    }
    destroyPeer();
    markConnected();
  }

  function onMqttMsg(sock, topic, msg) {
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
    if (transport && transport !== "mqtt") return;
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
        if (closed || transport) {
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

  function destroyPeer() {
    var p = peer;
    var c = conn;
    suppressClose = true;
    peer = null;
    conn = null;
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
    destroyMqtt();
    destroyPeer();
    openedOnce = false;
    transport = null;
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
    clearMqttTimers();
    emit("connected", { role: role, code: code });
  }

  function dropStaleConn(next) {
    var prev = conn;
    if (prev && prev !== next) {
      try { prev.close(); } catch (err) {}
    }
    conn = next;
  }

  function wireConn(c) {
    if (transport === "mqtt") {
      try { c.close(); } catch (err) {}
      return;
    }
    if (conn && conn !== c && conn.open) {
      try { c.close(); } catch (err) {}
      return;
    }
    dropStaleConn(c);
    c.on("data", function (msg) {
      if (!msg || typeof msg !== "object") return;
      emit(msg.t || "data", msg);
    });
    c.on("open", function () {
      if (closed || transport === "mqtt") return;
      transport = "webrtc";
      markConnected();
      destroyMqtt();
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
    makePeer(PREFIX + code, null);
    if (peer) {
      peer.on("connection", function (c) {
        if (transport === "mqtt") {
          try { c.close(); } catch (err) {}
          return;
        }
        if (conn && conn.open) {
          try { c.close(); } catch (err) {}
          return;
        }
        c.serialization = "json";
        wireConn(c);
      });
    }
  }

  function startWebrtcJoin() {
    makePeer(null, function () {
      if (closed || !peer || transport) return;
      var c = peer.connect(PREFIX + code, { serialization: "json", reliable: true });
      wireConn(c);
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
    startMqttSession();
    startWebrtcHost();
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
    startMqttSession();
    startWebrtcJoin();
    clearJoinTimer();
    joinTimer = setTimeout(function () {
      if (closed || openedOnce) return;
      fail("Could not reach host. Both stay on this game with internet, host keeps the code screen open, then tap Join again.", true);
    }, JOIN_MS);
  }

  function send(msg) {
    if (!msg || !openedOnce) return false;
    if (transport === "mqtt") return mqttPublish(mqttLive, mqttLive && mqttLive.pubTopic, msg);
    if (conn && conn.open) {
      try { conn.send(msg); return true; } catch (err) { return false; }
    }
    return false;
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
    code: function () { return code; }
  };
})();
