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
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        body: "",
      };
    }

    const qs = event.queryStringParameters || {};
    const id = qs.id || "";

    // ===== GET → SOLO HTML (FORMULARIO) =====
    if (event.httpMethod === "GET") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
        body: `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Check-in Flor de Lis</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="font-family:Arial;padding:20px">
  <h2>Check-in Flor de Lis</h2>
  <p><b>ID:</b> ${id}</p>
  <p>✔ Página cargada correctamente</p>
  <p>El formulario real se maneja por tu JS existente.</p>
</body>
</html>
        `,
      };
    }

    // ===== POST → SOLO JSON =====
    if (event.httpMethod === "POST") {
      let payload;
      try {
        payload = JSON.parse(event.body || "{}");
      } catch {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ok: false, error: "JSON inválido" }),
        };
      }

      const response = await fetch(WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return {
          statusCode: 502,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ok: false,
            error: "Apps Script no devolvió JSON",
            raw: text.slice(0, 500),
          }),
        };
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 405,
      body: "Método no permitido",
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: String(err) }),
    };
  }
};

