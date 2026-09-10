(function () {
  var pad = document.getElementById("touchpad");
  var overlay = document.getElementById("overlay");
  var muteBtn = document.getElementById("btn-mute");
  var pauseBtn = document.getElementById("btn-pause");
  var held = { left: 0, right: 0, fire: 0 };
  var ptr = {};

  function isStandalone() {
    if (window.navigator && window.navigator.standalone === true) return true;
    if (!window.matchMedia) return false;
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches;
  }
  document.documentElement.classList.toggle("is-pwa", isStandalone());

  function game() { return window.__galaga; }

  function btnFor(dir) {
    if (dir === "fire") return document.getElementById("pad-fire");
    if (dir === "left") return document.getElementById("pad-left");
    return document.getElementById("pad-right");
  }

  function syncPad() {
    if (!pad || !overlay) return;
    pad.classList.toggle("hidden", !overlay.classList.contains("hidden"));
  }

  function syncInput() {
    var g = game();
    if (!g || !g.setInput) return;
    g.setInput(held.left > 0, held.right > 0, held.fire > 0);
  }

  function dirFromTarget(t) {
    while (t && t !== pad) {
      if (t.getAttribute && t.getAttribute("data-dir")) return t.getAttribute("data-dir");
      t = t.parentNode;
    }
    return null;
  }

  function press(dir, id) {
    if (!dir || ptr[id]) return;
    ptr[id] = dir;
    held[dir] = (held[dir] || 0) + 1;
    var btn = btnFor(dir);
    if (btn) btn.classList.add("held");
    var g = game();
    if (g && g.ensureAudio) g.ensureAudio();
    if (dir === "fire") {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
    }
    syncInput();
  }

  function release(id) {
    var dir = ptr[id];
    if (!dir) return;
    delete ptr[id];
    held[dir] = Math.max(0, (held[dir] || 1) - 1);
    if (held[dir] === 0) {
      var btn = btnFor(dir);
      if (btn) btn.classList.remove("held");
      if (dir === "fire") {
        window.dispatchEvent(new KeyboardEvent("keyup", { key: " ", bubbles: true, cancelable: true }));
      }
    }
    syncInput();
  }

  if (pad) {
    pad.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var dir = dirFromTarget(e.target);
      if (!dir) return;
      try { pad.setPointerCapture(e.pointerId); } catch (err) {}
      press(dir, e.pointerId);
    });
    pad.addEventListener("pointerup", function (e) { release(e.pointerId); });
    pad.addEventListener("pointercancel", function (e) { release(e.pointerId); });
    pad.addEventListener("lostpointercapture", function (e) { release(e.pointerId); });
    pad.addEventListener("touchstart", function (e) { e.preventDefault(); }, { passive: false });
    pad.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
    pad.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", function (e) {
      e.preventDefault();
      var g = game();
      if (g && g.pauseGame) g.pauseGame();
    });
  }

  function refreshMute() {
    var g = game();
    var muted = g && g.isMuted ? g.isMuted() : false;
    if (!muteBtn) return;
    muteBtn.textContent = muted ? "Muted" : "Mute";
    muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    muteBtn.classList.toggle("on", !!muted);
  }

  if (muteBtn) {
    muteBtn.addEventListener("click", function (e) {
      e.preventDefault();
      var g = game();
      if (g && g.toggleMute) g.toggleMute();
      refreshMute();
    });
  }

  if (typeof MutationObserver === "function" && overlay) {
    new MutationObserver(syncPad).observe(overlay, { attributes: true, attributeFilter: ["class"] });
  }
  syncPad();
  refreshMute();
})();
