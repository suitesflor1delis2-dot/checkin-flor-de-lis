export async function handler(event) {
  const id = event.queryStringParameters?.id || "";
  if (!id) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Falta parámetro id" }),
    };
  }

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNPS_5R7N4kvWTI7ROlHTdSRGP4m1IWrlOJ9k5gxSfJL9Ei8pO_mvLx7qZc7zuXUxA/exec";

  try {
    const url = `${SCRIPT_URL}?id=${encodeURIComponent(id)}`;
    const res = await fetch(url);
    const text = await res.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: text,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Error en proxy: " + String(e) }),
    };
  }
}