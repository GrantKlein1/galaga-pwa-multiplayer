import { get, put, BlobPreconditionFailedError } from "@vercel/blob";

var PATH = "galaga-leaderboard.json";
var ACCESS = "private";
var MAX_ENTRIES = 100;
var TOP = 25;
var MAX_SCORE = 9999999;
var MAX_RETRIES = 4;

function jsonRes(data, status) {
  return Response.json(data, {
    status: status || 200,
    headers: { "Cache-Control": "no-store" }
  });
}

function sanitizeName(raw) {
  var s = String(raw || "").replace(/[^\w .\-]/g, "").replace(/\s+/g, " ").trim();
  if (s.length > 16) s = s.slice(0, 16).trim();
  return s;
}

function sanitizeId(raw) {
  var s = String(raw || "");
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(s)) return "";
  return s;
}

function sortEntries(entries) {
  return entries.slice().sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return (a.at || 0) - (b.at || 0);
  });
}

function publicView(board, pid) {
  var entries = sortEntries(board.entries || []);
  var you = null;
  var i;
  for (i = 0; i < entries.length; i++) {
    if (pid && entries[i].id === pid) {
      you = { rank: i + 1, name: entries[i].name, score: entries[i].score };
      break;
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

async function readBoard() {
  var result = await get(PATH, { access: ACCESS, useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return { board: { v: 1, entries: [] }, etag: null };
  }
  var text = await new Response(result.stream).text();
  var board;
  try { board = JSON.parse(text); } catch (err) { board = null; }
  if (!board || !Array.isArray(board.entries)) board = { v: 1, entries: [] };
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
  var name = sanitizeName(body.name);
  var score = body.score;
  if (typeof score !== "number" || !isFinite(score)) score = parseInt(score, 10);
  score = score | 0;
  if (!id || !name) return jsonRes({ error: "bad_request" }, 400);
  if (score < 0 || score > MAX_SCORE) return jsonRes({ error: "bad_score" }, 400);

  var attempt = 0;
  try {
    for (attempt = 0; attempt < MAX_RETRIES; attempt++) {
      var got = await readBoard();
      var board = got.board;
      var entries = Array.isArray(board.entries) ? board.entries.slice() : [];
      var idx = -1;
      var i;
      for (i = 0; i < entries.length; i++) {
        if (entries[i] && entries[i].id === id) { idx = i; break; }
      }
      var now = Date.now();
      if (idx >= 0) {
        entries[idx].name = name;
        if (score > (entries[idx].score | 0)) {
          entries[idx].score = score;
          entries[idx].at = now;
        }
      } else if (score > 0) {
        entries.push({ id: id, name: name, score: score, at: now });
      } else {
        return jsonRes(publicView({ v: 1, entries: entries }, id));
      }
      entries = sortEntries(entries);
      if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
      board = { v: 1, entries: entries };
      try {
        await writeBoard(board, got.etag);
        return jsonRes(publicView(board, id));
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
