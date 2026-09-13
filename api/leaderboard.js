import { get, put, BlobPreconditionFailedError } from "@vercel/blob";

var PATH = "galaga-leaderboard.json";
var ACCESS = "private";
var MAX_ENTRIES = 100;
var MAX_HIDDEN = 500;
var TOP = 25;
var MAX_SCORE = 9999999;
var MAX_RETRIES = 4;

function jsonRes(data, status) {
  return Response.json(data, {
    status: status || 200,
    headers: { "Cache-Control": "no-store" }
  });
}

export function sanitizeName(raw) {
  var s = String(raw || "").replace(/[^\w .\-]/g, "").replace(/\s+/g, " ").trim();
  if (s.length > 16) s = s.slice(0, 16).trim();
  return s;
}

export function nameKey(raw) {
  return sanitizeName(raw).toLowerCase().replace(/ /g, "_");
}

export function nameTakenByOther(board, name, exceptId) {
  var want = nameKey(name);
  var entries, i, row;
  if (!want) return false;
  entries = Array.isArray(board && board.entries) ? board.entries : [];
  for (i = 0; i < entries.length; i++) {
    row = entries[i];
    if (!row || row.id === exceptId) continue;
    if (nameKey(row.name) === want) return true;
  }
  return false;
}

export function sanitizeId(raw) {
  var s = String(raw || "");
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(s)) return "";
  return s;
}

export function sortEntries(entries) {
  return entries.slice().sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return (a.at || 0) - (b.at || 0);
  });
}

export function hiddenList(board) {
  var out = [], seen = {}, list, i, id;
  list = board && Array.isArray(board.hidden) ? board.hidden : [];
  for (i = 0; i < list.length; i++) {
    id = sanitizeId(list[i]);
    if (!id || seen[id]) continue;
    seen[id] = 1;
    out.push(id);
  }
  return out;
}

export function hiddenSet(board) {
  var set = {}, list = hiddenList(board), i;
  for (i = 0; i < list.length; i++) set[list[i]] = 1;
  return set;
}

function dropPid(entries, id) {
  var out = [], i, row;
  for (i = 0; i < entries.length; i++) {
    row = entries[i];
    if (!row || row.id === id) continue;
    out.push(row);
  }
  return out;
}

export function visibleEntries(board) {
  var hidden = hiddenSet(board);
  var entries = Array.isArray(board && board.entries) ? board.entries : [];
  var out = [], i, row;
  for (i = 0; i < entries.length; i++) {
    row = entries[i];
    if (!row || !row.id || hidden[row.id]) continue;
    out.push(row);
  }
  return sortEntries(out);
}

export function publicView(board, pid) {
  var entries = visibleEntries(board);
  var hidden = hiddenSet(board);
  var you = null;
  var i;
  if (pid && !hidden[pid]) {
    for (i = 0; i < entries.length; i++) {
      if (entries[i].id === pid) {
        you = { rank: i + 1, name: entries[i].name, score: entries[i].score };
        break;
      }
    }
  }
  return {
    entries: entries.slice(0, TOP).map(function (e) {
      return { name: e.name, score: e.score };
    }),
    you: you,
    total: entries.length
  };
}

export function applyHide(board, id) {
  var entries = dropPid(Array.isArray(board && board.entries) ? board.entries : [], id);
  var hidden = hiddenList(board);
  if (hidden.indexOf(id) < 0) hidden.push(id);
  if (hidden.length > MAX_HIDDEN) hidden = hidden.slice(hidden.length - MAX_HIDDEN);
  return { v: 1, entries: sortEntries(entries), hidden: hidden };
}

export function applyScore(board, id, name, score, now) {
  var hidden = hiddenList(board);
  var entries, idx, i;
  if (hidden.indexOf(id) >= 0) {
    return { board: applyHide(board, id), skipped: true };
  }
  entries = Array.isArray(board && board.entries) ? board.entries.slice() : [];
  idx = -1;
  for (i = 0; i < entries.length; i++) {
    if (entries[i] && entries[i].id === id) { idx = i; break; }
  }
  if (idx >= 0) {
    entries[idx].name = name;
    if (score > (entries[idx].score | 0)) {
      entries[idx].score = score;
      entries[idx].at = now;
    }
  } else if (score > 0) {
    entries.push({ id: id, name: name, score: score, at: now });
  } else {
    return { board: { v: 1, entries: entries, hidden: hidden }, skipped: true };
  }
  entries = sortEntries(entries);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  return { board: { v: 1, entries: entries, hidden: hidden }, skipped: false };
}

export async function readBoard() {
  var result = await get(PATH, { access: ACCESS, useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return { board: { v: 1, entries: [], hidden: [] }, etag: null };
  }
  var text = await new Response(result.stream).text();
  var board;
  try { board = JSON.parse(text); } catch (err) { board = null; }
  if (!board || !Array.isArray(board.entries)) board = { v: 1, entries: [], hidden: [] };
  if (!Array.isArray(board.hidden)) board.hidden = [];
  return { board: board, etag: result.blob && result.blob.etag ? result.blob.etag : null };
}

async function writeBoard(board, etag) {
  var opts = {
    access: ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: "application/json"
  };
  if (etag) opts.ifMatch = etag;
  await put(PATH, JSON.stringify(board), opts);
}

export async function GET(request) {
  try {
    var url = new URL(request.url);
    var pid = sanitizeId(url.searchParams.get("id"));
    var got = await readBoard();
    return jsonRes(publicView(got.board, pid));
  } catch (err) {
    console.error("leaderboard GET", err);
    return jsonRes({ error: "unavailable", entries: [], you: null, total: 0 }, 503);
  }
}

export async function POST(request) {
  var body;
  try { body = await request.json(); } catch (err) { body = null; }
  if (!body || typeof body !== "object") return jsonRes({ error: "bad_request" }, 400);

  var id = sanitizeId(body.id);
  var hide = !!body.hide;
  var name = sanitizeName(body.name);
  var score = body.score;
  if (!id) return jsonRes({ error: "bad_request" }, 400);
  if (!hide) {
    if (typeof score !== "number" || !isFinite(score)) score = parseInt(score, 10);
    score = score | 0;
    if (!name) return jsonRes({ error: "bad_request" }, 400);
    if (score < 0 || score > MAX_SCORE) return jsonRes({ error: "bad_score" }, 400);
  }

  var attempt = 0;
  try {
    for (attempt = 0; attempt < MAX_RETRIES; attempt++) {
      var got = await readBoard();
      var board = got.board;
      var next;
      if (hide || hiddenSet(board)[id]) {
        next = applyHide(board, id);
      } else {
        next = applyScore(board, id, name, score, Date.now());
        if (next.skipped) return jsonRes(publicView(next.board, id));
        next = next.board;
      }
      try {
        await writeBoard(next, got.etag);
        return jsonRes(publicView(next, id));
      } catch (err) {
        if (err instanceof BlobPreconditionFailedError) continue;
        throw err;
      }
    }
    return jsonRes({ error: "busy" }, 409);
  } catch (err) {
    console.error("leaderboard POST", err);
    return jsonRes({ error: "unavailable" }, 503);
  }
}
