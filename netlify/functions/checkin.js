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

    // ===== GET → REDIRIGE AL FORMULARIO =====
    if (event.httpMethod === "GET") {
      const id = event.queryStringParameters?.id || "";
      return {
        statusCode: 302,
        headers: {
          Location: `https://checkin-flor-de-lis.netlify.app/?id=${id}`,
        },
        body: "",
      };
    }

    // ===== POST =====
    const payload = JSON.parse(event.body || "{}");

    const response = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: text,
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: "ERROR NETLIFY: " + String(err),
    };
  }
};
