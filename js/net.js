(function () {
  var ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var JOIN_MS = 18000;
  var TURN_MS = 1500;
  var RTC_FALLBACK_MS = 8000;
  var RTC_RETRY_MS = 8000;
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

  var rtc = null;
  var gameDc = null;
  var reliableDc = null;
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
  var turnDone = false;
  var rtcFallbackTimer = 0;
  var pingTimer = 0;
  var statsTimer = 0;
  var lastRtt = 0;
  var icePath = "";
  var iceRtt = 0;
  var pendingIce = [];
  var pendingSig = [];
  var remoteSet = false;
  var rtcGen = 0;
  var lastOffer = null;
  var lastAnswer = null;
  var localCands = [];
  var answering = false;
  var rtcRetryTimer = 0;
  var offerTimer = 0;

  function iceList() {
    var list = ICE_SERVERS.slice();
    var i;
    for (i = 0; i < turnServers.length; i++) list.push(turnServers[i]);
    return list;
  }

  function filterIce(list) {
    var udp = [], tcp = [], stun = [], i, one, urls, j, u, udpUrls, tcpUrls, entry;
    if (!list || !list.length) return [];
    for (i = 0; i < list.length; i++) {
      one = list[i];
      if (!one) continue;
      urls = Array.isArray(one.urls) ? one.urls : [one.urls];
      udpUrls = [];
      tcpUrls = [];
      for (j = 0; j < urls.length; j++) {
        u = String(urls[j] || "");
        if (!u) continue;
        if (u.indexOf("stun:") === 0) stun.push({ urls: u });
        else if (u.indexOf("transport=tcp") >= 0) tcpUrls.push(u);
        else udpUrls.push(u);
      }
      if (udpUrls.length) {
        entry = { urls: udpUrls.length === 1 ? udpUrls[0] : udpUrls };
        if (one.username) entry.username = one.username;
        if (one.credential) entry.credential = one.credential;
        udp.push(entry);
      }
      if (tcpUrls.length) {
        entry = { urls: tcpUrls.length === 1 ? tcpUrls[0] : tcpUrls };
        if (one.username) entry.username = one.username;
        if (one.credential) entry.credential = one.credential;
        tcp.push(entry);
      }
    }
    return stun.concat(udp).concat(tcp);
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
    if (rtcFallbackTimer) { clearTimeout(rtcFallbackTimer); rtcFallbackTimer = 0; }
    if (pingTimer) { clearInterval(pingTimer); pingTimer = 0; }
    if (statsTimer) { clearInterval(statsTimer); statsTimer = 0; }
    if (rtcRetryTimer) { clearTimeout(rtcRetryTimer); rtcRetryTimer = 0; }
    if (offerTimer) { clearInterval(offerTimer); offerTimer = 0; }
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

  function mqttSignal(msg) {
    if (!mqttLive) return false;
    return mqttPublish(mqttLive, mqttLive.pubTopic, msg);
  }

  function startMqttKeepalive(sock) {
    if (mqttPingTimer) clearInterval(mqttPingTimer);
    mqttPingTimer = setInterval(function () {
      if (!sock || sock.dead || !sock.ws || sock.ws.readyState !== 1) return;
      try { sock.ws.send(pingPacket()); } catch (err) {}
    }, 15000);
  }

  function attachMqtt(sock) {
    if (closed || !sock) return;
    if (mqttLive && mqttLive !== sock) return;
    mqttLive = sock;
    startMqttKeepalive(sock);
    var i, s;
    for (i = 0; i < mqttSocks.length; i++) {
      s = mqttSocks[i];
      if (s !== sock) closeMqttSock(s);
    }
    startRtcIfReady();
    scheduleMqttFallback();
    scheduleRtcRetry();
  }

  function scheduleMqttFallback() {
    if (rtcFallbackTimer || closed || transport === "webrtc") return;
    rtcFallbackTimer = setTimeout(function () {
      rtcFallbackTimer = 0;
      if (closed || transport === "webrtc") return;
      adoptMqttGame();
    }, RTC_FALLBACK_MS);
  }

  function adoptMqttGame() {
    if (closed || transport === "webrtc") return;
    if (transport === "mqtt") return;
    if (!mqttLive) return;
    transport = "mqtt";
    markConnected();
    startPing();
    emit("transport", stats());
  }

  function onMqttMsg(sock, msg) {
    if (!msg || typeof msg !== "object") return;
    if (msg.t === "netping") {
      mqttPublish(sock, sock.pubTopic, { t: "netpong" });
      if (role === "host") attachMqtt(sock);
      return;
    }
    if (msg.t === "netpong") {
      if (role === "client") attachMqtt(sock);
      return;
    }
    if (msg.t === "sig") {
      attachMqtt(sock);
      handleSignal(msg);
      return;
    }
    if (handleRtt(msg)) return;
    if (transport === "webrtc" && (msg.t === "snap" || msg.t === "input")) return;
    if (mqttLive && sock !== mqttLive) return;
    emit(msg.t || "data", msg);
  }

  function startMqttSession() {
    var i, cid, sock, sub, pub;
    sub = role === "host" ? "h" : "c";
    pub = role === "host" ? "c" : "h";
    for (i = 0; i < MQTT_BROKERS.length; i++) {
      cid = "g" + role.charAt(0) + code + Math.random().toString(36).slice(2, 6);
      sock = openMqtt(MQTT_BROKERS[i], cid, null);
      if (!sock) continue;
      sock.subTopic = topicFor(sub);
      sock.pubTopic = topicFor(pub);
    }
    if (role === "client") {
      mqttHsTimer = setInterval(function () {
        if (closed || mqttLive) {
          if (mqttHsTimer) { clearInterval(mqttHsTimer); mqttHsTimer = 0; }
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

  function parseIncoming(raw) {
    var text, u8;
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

  function onDcMessage(ev) {
    var msg = parseIncoming(ev.data);
    if (!msg || typeof msg !== "object") return;
    if (handleRtt(msg)) return;
    emit(msg.t || "data", msg);
  }

  function bindDc(dc) {
    if (!dc) return;
    try { dc.binaryType = "arraybuffer"; } catch (err) {}
    dc.onmessage = onDcMessage;
    dc.onopen = function () {
      adoptWebrtc();
      sendPing();
    };
    dc.onclose = function () {
      if (closed || suppressClose) return;
      if (transport === "webrtc" && !dcOpen()) {
        transport = mqttLive ? "mqtt" : null;
        emit("transport", stats());
      }
    };
    if (dc.label === "game") gameDc = dc;
    else reliableDc = dc;
    if (dc.readyState === "open") {
      adoptWebrtc();
    }
  }

  function dcOpen() {
    return (gameDc && gameDc.readyState === "open") || (reliableDc && reliableDc.readyState === "open");
  }

  function candJson(cand) {
    if (!cand) return null;
    if (typeof cand.toJSON === "function") return cand.toJSON();
    return {
      candidate: cand.candidate,
      sdpMid: cand.sdpMid,
      sdpMLineIndex: cand.sdpMLineIndex
    };
  }

  function addIce(cand) {
    if (!rtc || !cand) return;
    if (!remoteSet) {
      pendingIce.push(cand);
      return;
    }
    try {
      rtc.addIceCandidate(new RTCIceCandidate(cand)).catch(function () {});
    } catch (err) {}
  }

  function flushIce() {
    var list = pendingIce;
    var i;
    pendingIce = [];
    for (i = 0; i < list.length; i++) addIce(list[i]);
  }

  function replayLocalSig() {
    var i;
    if (!mqttLive) return;
    if (role === "host" && lastOffer) {
      mqttSignal({ t: "sig", k: "offer", sdp: lastOffer });
    }
    if (role === "client" && lastAnswer) {
      mqttSignal({ t: "sig", k: "answer", sdp: lastAnswer });
    }
    for (i = 0; i < localCands.length; i++) {
      mqttSignal({ t: "sig", k: "ice", cand: localCands[i] });
    }
  }

  function startOfferRepeat() {
    if (offerTimer) clearInterval(offerTimer);
    offerTimer = setInterval(function () {
      if (closed || transport === "webrtc") {
        clearInterval(offerTimer);
        offerTimer = 0;
        return;
      }
      if (role === "host" && remoteSet) {
        clearInterval(offerTimer);
        offerTimer = 0;
        return;
      }
      replayLocalSig();
    }, 400);
  }

  function handleSignal(msg) {
    if (!msg || closed) return;
    if (msg.k === "hello") {
      if (role === "host") {
        if (!rtc) startRtcIfReady();
        replayLocalSig();
      }
      return;
    }
    if (!rtc) {
      pendingSig.push(msg);
      startRtcIfReady();
      return;
    }
    if (msg.k === "ice") {
      addIce(msg.cand);
      return;
    }
    if (msg.k === "offer" && msg.sdp && role === "client") {
      if (lastAnswer) {
        mqttSignal({ t: "sig", k: "answer", sdp: lastAnswer });
        return;
      }
      if (answering || remoteSet) return;
      answering = true;
      rtc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).then(function () {
        remoteSet = true;
        flushIce();
        return rtc.createAnswer();
      }).then(function (answer) {
        return rtc.setLocalDescription(answer);
      }).then(function () {
        lastAnswer = { type: rtc.localDescription.type, sdp: rtc.localDescription.sdp };
        mqttSignal({ t: "sig", k: "answer", sdp: lastAnswer });
        startOfferRepeat();
      }).catch(function () {
        answering = false;
      });
      return;
    }
    if (msg.k === "answer" && msg.sdp && role === "host") {
      if (remoteSet) return;
      rtc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).then(function () {
        remoteSet = true;
        flushIce();
        if (offerTimer) { clearInterval(offerTimer); offerTimer = 0; }
      }).catch(function () {});
    }
  }

  function onRtcFailed() {
    if (closed) return;
    if (transport === "webrtc") {
      transport = mqttLive ? "mqtt" : null;
      emit("transport", stats());
    }
    destroyRtc();
    if (mqttLive && turnDone && !closed) startRtcIfReady();
  }

  function startRtcIfReady() {
    var queued;
    if (closed || rtc || !mqttLive || !turnDone) return;
    if (typeof RTCPeerConnection !== "function") {
      adoptMqttGame();
      return;
    }
    rtcGen += 1;
    pendingIce = [];
    remoteSet = false;
    answering = false;
    lastOffer = null;
    lastAnswer = null;
    localCands = [];
    icePath = "";
    try {
      rtc = new RTCPeerConnection({
        iceServers: iceList(),
        iceCandidatePoolSize: 4,
        bundlePolicy: "max-bundle"
      });
    } catch (err) {
      adoptMqttGame();
      return;
    }
    rtc.onicecandidate = function (ev) {
      var json;
      if (!ev || !ev.candidate) return;
      json = candJson(ev.candidate);
      if (!json) return;
      localCands.push(json);
      mqttSignal({ t: "sig", k: "ice", cand: json });
    };
    rtc.ondatachannel = function (ev) {
      if (ev && ev.channel) bindDc(ev.channel);
    };
    rtc.onconnectionstatechange = function () {
      if (!rtc || closed) return;
      if (rtc.connectionState === "connected") adoptWebrtc();
      if (rtc.connectionState === "failed") onRtcFailed();
    };
    rtc.oniceconnectionstatechange = function () {
      if (!rtc || closed) return;
      if (rtc.iceConnectionState === "connected" || rtc.iceConnectionState === "completed") adoptWebrtc();
      if (rtc.iceConnectionState === "failed") onRtcFailed();
    };
    if (role === "host") {
      try {
        bindDc(rtc.createDataChannel("rel", { ordered: true }));
        bindDc(rtc.createDataChannel("game", { ordered: false, maxRetransmits: 0 }));
      } catch (err) {
        destroyRtc();
        adoptMqttGame();
        return;
      }
      rtc.createOffer().then(function (offer) {
        return rtc.setLocalDescription(offer);
      }).then(function () {
        lastOffer = { type: rtc.localDescription.type, sdp: rtc.localDescription.sdp };
        mqttSignal({ t: "sig", k: "offer", sdp: lastOffer });
        startOfferRepeat();
      }).catch(function () {});
    } else {
      mqttSignal({ t: "sig", k: "hello" });
    }
    queued = pendingSig;
    pendingSig = [];
    if (queued.length) {
      setTimeout(function () {
        var i;
        for (i = 0; i < queued.length; i++) handleSignal(queued[i]);
      }, 0);
    }
  }

  function scheduleRtcRetry() {
    if (rtcRetryTimer || closed) return;
    rtcRetryTimer = setTimeout(function () {
      rtcRetryTimer = 0;
      if (closed || transport === "webrtc") return;
      if (rtc && (rtc.connectionState === "connecting" || rtc.iceConnectionState === "checking")) {
        scheduleRtcRetry();
        return;
      }
      destroyRtc();
      startRtcIfReady();
      scheduleRtcRetry();
    }, RTC_RETRY_MS);
  }

  function destroyRtc() {
    var g = gameDc;
    var r = reliableDc;
    var pc = rtc;
    gameDc = null;
    reliableDc = null;
    rtc = null;
    remoteSet = false;
    answering = false;
    pendingIce = [];
    lastOffer = null;
    lastAnswer = null;
    localCands = [];
    if (offerTimer) { clearInterval(offerTimer); offerTimer = 0; }
    if (g) { try { g.close(); } catch (err) {} }
    if (r) { try { r.close(); } catch (err) {} }
    if (pc) { try { pc.close(); } catch (err) {} }
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
    destroyRtc();
    openedOnce = false;
    transport = null;
    lastRtt = 0;
    icePath = "";
    iceRtt = 0;
    turnServers = [];
    turnDone = false;
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
    emit("connected", { role: role, code: code, transport: transport, path: pathLabel() });
  }

  function adoptWebrtc() {
    var upgraded;
    if (closed || !dcOpen()) return;
    upgraded = transport === "mqtt";
    if (transport === "webrtc") return;
    transport = "webrtc";
    if (rtcFallbackTimer) { clearTimeout(rtcFallbackTimer); rtcFallbackTimer = 0; }
    if (rtcRetryTimer) { clearTimeout(rtcRetryTimer); rtcRetryTimer = 0; }
    if (offerTimer) { clearInterval(offerTimer); offerTimer = 0; }
    markConnected();
    startPing();
    startStats();
    sampleIce();
    if (upgraded || openedOnce) emit("transport", stats());
  }

  function beginSession() {
    turnDone = false;
    startMqttSession();
    fetchTurn(function (servers) {
      if (closed) return;
      turnServers = servers;
      turnDone = true;
      startRtcIfReady();
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
    emit("error", { message: "Connecting… trying a fast link first", retrying: true });
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

  function sendDc(dc, payload) {
    if (!dc || dc.readyState !== "open") return false;
    try {
      if (payload instanceof Uint8Array) dc.send(payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength));
      else if (payload instanceof ArrayBuffer) dc.send(payload);
      else dc.send(JSON.stringify(payload));
      return true;
    } catch (err) {
      return false;
    }
  }

  function send(msg) {
    var payload;
    var body;
    if (!msg || !openedOnce) return false;
    payload = encodeOutgoing(msg);
    body = payload instanceof Uint8Array ? payload : msg;
    if (payload instanceof Uint8Array || isUnreliableMsg(msg)) {
      if (sendDc(gameDc, payload)) return true;
      if (sendDc(reliableDc, payload)) return true;
    } else {
      if (sendDc(reliableDc, body)) return true;
      if (sendDc(gameDc, body)) return true;
    }
    if (transport === "webrtc") return false;
    if (mqttLive) return mqttPublish(mqttLive, mqttLive.pubTopic, payload);
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
    if (!rtc || !rtc.getStats) return;
    rtc.getStats().then(function (report) {
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
      var remote = picked.remoteCandidateId ? report.get(picked.remoteCandidateId) : null;
      var lt = local && (local.candidateType || local.type);
      var rt = remote && (remote.candidateType || remote.type);
      if (lt === "relay" || rt === "relay") icePath = "relay";
      else icePath = lt || rt || "host";
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
    isConnected: function () {
      if (!openedOnce) return false;
      if (transport === "webrtc") return dcOpen();
      return !!mqttLive;
    },
    role: function () { return role; },
    code: function () { return code; },
    transport: function () { return transport; },
    stats: stats
  };
})();
