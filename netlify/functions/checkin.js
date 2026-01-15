export async function handler(event) {
  try {
    const qs = event.queryStringParameters || {};
    const id = String(qs.id || qs.ID || "").trim();
    const confirm = String(qs.confirm || "").trim();

    if (!id) {
      return html(400, `<h2>❌ Falta el parámetro id</h2><p>Ejemplo: ?id=FLS_0000343</p>`);
    }

    // ✅ PON AQUÍ TU URL REAL (DEBE TERMINAR EN /exec)
    const GOOGLE_SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbw3GIzb3TtHqY8VNEXyYLWcGnphswHEqkAtcB5T0KenL-gFOotr0m_LN__DMa3PIkuV/exec";

    // --------- CONFIRM (REGISTRA) ----------
    if (confirm === "1") {
      const pin = String(qs.pin || "").trim();
      const personal = String(qs.personal || "").trim();

      const form = new URLSearchParams();
      form.set("id", id);
      form.set("pin", pin);
      form.set("personal", personal);

      const resp = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });

      const txt = await resp.text();

      return html(
        200,
        `
        <h2>DEBUG: Confirmación</h2>
        <p><b>Apps Script URL:</b> ${esc(GOOGLE_SCRIPT_URL)}</p>
        <p><b>Status Apps Script:</b> ${resp.status}</p>
        <p><b>ID:</b> ${esc(id)}</p>
        <p><b>Personal:</b> ${esc(personal)}</p>
        <pre style="background:#f6f6f6;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(txt)}</pre>
        <p><a href="?id=${encodeURIComponent(id)}">↩ Volver</a></p>
        `
      );
    }

    // --------- VALIDACIÓN (SOLO LEE) ----------
    const url = `${GOOGLE_SCRIPT_URL}?id=${encodeURIComponent(id)}`;
    const resp = await fetch(url);
    const txt = await resp.text();

    return html(
      200,
      `
      <h2>DEBUG: Validación</h2>
      <p><b>URL llamada:</b> ${esc(url)}</p>
      <p><b>Status Apps Script:</b> ${resp.status}</p>
      <pre style="background:#f6f6f6;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(txt)}</pre>

      <hr/>
      <h3>👮 Solo personal</h3>
      <form method="GET" action="">
        <input type="hidden" name="id" value="${esc(id)}"/>
        <input type="hidden" name="confirm" value="1"/>
        <input name="personal" placeholder="Nombre del personal" style="padding:8px;width:220px"/>
        <br/><br/>
        <input name="pin" type="password" placeholder="PIN" style="padding:8px;width:220px"/>
        <br/><br/>
        <button type="submit" style="padding:10px 14px">Confirmar ingreso</button>
      </form>
      `
    );
  } catch (e) {
    return html(500, `<h2>❌ Error Netlify</h2><pre>${esc(e.stack || e.message)}</pre>`);
  }
}

function html(code, body) {
  return {
    statusCode: code,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<div style="font-family:Arial;padding:18px">${body}</div>`,
  };
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
