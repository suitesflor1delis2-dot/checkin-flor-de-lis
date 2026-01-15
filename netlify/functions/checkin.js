export async function handler(event) {
  const id = event.queryStringParameters?.id || "";
  if (!id) {
    return {
      statusCode: 400,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Falta parámetro id" }),
    };
  }

  // AQUÍ LLAMAS A TU APPS SCRIPT REAL
  const APPS_SCRIPT_URL = "PON_AQUI_TU_URL_DE_APPS_SCRIPT_EXEC";

  const url = `${APPS_SCRIPT_URL}?id=${encodeURIComponent(id)}`;
  const r = await fetch(url, { redirect: "follow" });
  const text = await r.text();

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: text, // Apps Script ya devuelve JSON
  };
}
