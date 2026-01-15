export async function handler(event) {
  try {
    const id = event.queryStringParameters?.id;
    if (!id) return html(400, `<h2>❌ Falta el parámetro id</h2><p>Ejemplo: ?id=FLS_0000343</p>`);

    const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw3GIzb3TtHqY8VNEXyYLWcGnphswHEqkAtcB5T0KenL-gFOotr0m_LN__DMa3PIkuV/exec";
    // Si viene confirm=1, registramos (solo personal) via POST
    if (event.queryStringParameters?.confirm === "1") {
      const pin = event.queryStringParameters?.pin || "";
      const guardia = event.queryStringParameters?.guardia || "PERSONAL";

      const form = new URLSearchParams();
      form.set("id", id);
      form.set("pin", pin);
      form.set("guardia", guardia);

      const resp = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString()
      });

      const txt = await resp.text();
      return html(200, wrap("Resultado de registro", id, txt, true));
    }

    // Caso normal: solo validar por GET
    const resp = await fetch(`${GOOGLE_SCRIPT_URL}?id=${encodeURIComponent(id)}`);
    const txt = await resp.text();

    // Mostrar validación + formulario de personal
    return html(200, `
      ${wrap("Validación de reserva", id, txt, false)}
      <hr/>
      <h3>👮 Solo personal</h3>
      <p>Para registrar el ingreso, ingrese PIN:</p>
      <form method="GET" action="">
        <input type="hidden" name="id" value="${esc(id)}"/>
        <input type="hidden" name="confirm" value="1"/>
        <input name="guardia" placeholder="Nombre del personal" style="padding:8px;width:220px"/>
        <br/><br/>
        <input name="pin" type="password" placeholder="PIN" style="padding:8px;width:220px"/>
        <br/><br/>
        <button type="submit" style="padding:10px 14px">Confirmar ingreso</button>
      </form>
    `);
  } catch (e) {
    return html(500, `<h2>❌ Error</h2><pre>${esc(e.message)}</pre>`);
  }
}

function html(code, body) {
  return { statusCode: code, headers: { "Content-Type": "text/html; charset=utf-8" }, body: `<div style="font-family:Arial;padding:18px">${body}</div>` };
}
function wrap(title, id, txt, isRegister) {
  return `
    <h2>${esc(title)}</h2>
    <p><b>ID:</b> ${esc(id)}</p>
    <pre style="background:#f6f6f6;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(txt)}</pre>
    ${isRegister ? `<p><a href="?id=${encodeURIComponent(id)}">↩ Volver</a></p>` : ``}
  `;
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

