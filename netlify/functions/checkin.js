export async function handler(event) {
  try {
    const id = event.queryStringParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: `
          <h2>❌ Falta el parámetro id</h2>
          <p>Ejemplo: ?id=FLS_0000343</p>
        `
      };
    }

    const GOOGLE_SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbwiCYtqBiznqttrW8Nx_iPoJpY_JMkSNOB-LX1MgKA08hsli41ZC1z6gpHPdWu7TaT0/exec";

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?id=${encodeURIComponent(id)}`);
    const resultText = await response.text();

    // ✅ Título dinámico según lo que responda Apps Script
    const title = pickTitle(resultText);

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: `
        <div style="font-family:Arial;padding:18px">
          <h2>${escapeHtml(title)}</h2>
          <p>ID: <strong>${escapeHtml(id)}</strong></p>
          <pre style="background:#f6f6f6;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(resultText)}</pre>
        </div>
      `
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: `
        <h2>❌ Error en el check-in</h2>
        <pre>${escapeHtml(error.message)}</pre>
      `
    };
  }
}

// --- Helpers ---
function pickTitle(text) {
  const t = String(text || "").toLowerCase();

  if (t.includes("aún no inicia") || t.includes("aun no inicia")) return "⏳ Reserva aún no inicia";
  if (t.includes("vencida") || t.includes("antigua")) return "❌ Reserva vencida o antigua";
  if (t.includes("ya fue utilizado") || t.includes("previamente registrado") || t.includes("ya fue usado")) return "⚠️ Reserva ya utilizada";
  if (t.includes("reserva válida") || t.includes("reserva valida")) return "✅ Reserva válida";
  if (t.includes("id no encontrado") || t.includes("no encontrado")) return "❌ Reserva no válida";

  // fallback
  return "Resultado de verificación";
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}
