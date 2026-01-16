// netlify/functions/checkin.js

const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbznzmdsNzjEpqCUoy0KcOKkTunU_RDJClTAKRd8xjFN1iTpAWQR-BRTHgdTwtmgV93Z/exec";

function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

    // ✅ SI LLEGA GET, DEVUELVE JSON (NO HTML)
    if (event.httpMethod === "GET") {
      const qs = event.queryStringParameters || {};
      const id = String(qs.id || qs.ID || "").trim();
      return json(200, { ok: true, metodo: "GET", id, hint: "Usa POST para registrar" });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Metodo no permitido" });
    }

    // reenviar tal cual el body (tu frontend ya manda id/pin/fotos)
    const r = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: event.body || "{}",
    });

    const text = await r.text();

    // devolver lo que venga. si no es JSON, lo envolvemos en JSON para que no reviente
    try {
      const data = JSON.parse(text);
      return json(200, data);
    } catch {
      return json(502, {
        ok: false,
        error: "Apps Script devolvio HTML/no-JSON",
        http_status: r.status,
        body_preview: text.slice(0, 1200),
      });
    }
  } catch (e) {
    return json(500, { ok: false, error: String(e) });
  }
};
