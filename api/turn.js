var TTL_MS = 5 * 60 * 1000;
var cache = { at: 0, iceServers: null };

function jsonRes(data, status) {
  return Response.json(data, {
    status: status || 200,
    headers: { "Cache-Control": "no-store" }
  });
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.iceServers)) return data.iceServers;
  return [];
}

export async function GET() {
  var app = process.env.METERED_APP;
  var key = process.env.METERED_API_KEY;
  if (!app || !key) return jsonRes({ iceServers: [] });

  var now = Date.now();
  if (cache.iceServers && now - cache.at < TTL_MS) {
    return jsonRes({ iceServers: cache.iceServers });
  }

  var url = "https://" + app + ".metered.live/api/v1/turn/credentials?apiKey=" + encodeURIComponent(key);
  try {
    var res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("turn GET status", res.status);
      return jsonRes({ iceServers: cache.iceServers || [] }, 200);
    }
    var iceServers = asArray(await res.json());
    cache = { at: now, iceServers: iceServers };
    return jsonRes({ iceServers: iceServers });
  } catch (err) {
    console.error("turn GET", err);
    return jsonRes({ iceServers: cache.iceServers || [] }, 200);
  }
}
