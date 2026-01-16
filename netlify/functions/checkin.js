// netlify/functions/checkin.js

const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbznzmdsNzjEpqCUoy0KcOKkTunU_RDJClTAKRd8xjFN1iTpAWQR-BRTHgdTwtmgV93Z/exec";

exports.handler = async (event) => {
  try {
    // ===== CORS =====
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        body: "",
      };
    }

    // ===== SOLO POST =====
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ ok: true }),
      };
    }

    // ===== LEER JSON =====
    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch (err) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          ok: false,
          error: "JSON inválido en Netlify",
        }),
      };
    }

    // ===== POST A APPS SCRIPT =====
    const response = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    // ===== FORZAR JSON =====
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
        },
        body:
          "ERROR: Apps Script NO devolvió JSON.\n\n" +
          "HTTP STATUS: " +
          response.status +
          "\n\nRESPUESTA:\n" +
          text.slice(0, 2000),
      };
    }

    // ===== OK =====
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        ok: false,
        error: "Error interno Netlify",
        detail: String(err),
      }),
    };
  }
};
