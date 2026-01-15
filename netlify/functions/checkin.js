export async function handler(event) {
  try {
    // aceptar id o ID
    const id = (event.queryStringParameters?.id || event.queryStringParameters?.ID || "").trim();

    if (!id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: `<h2>❌ Falta el parámetro id</h2><p>Ejemplo: ?id=FLS_0000343</p>`
      };
    }

    const GOOGLE_SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbw3GIzb3TtHqY8VNEXyYLWcGnphswHEqkAtcB5T0KenL-gFOotr0m_LN__DMa3PIkuV/exec";

    // Confirmación (solo personal) -> registra via POST
    if (event.queryStringParameters?.confirm === "1") {
      const pin = (event.queryStringParameters?.pin || "").trim();
      const personal = (event.queryStringParameters?.personal || "").trim();

      const form = new URLSearchParams();
      form.set("id", id);
      form.set("pin", pin);
      form.set("personal", personal);

      const resp = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString()
      });

      const txt = await resp.text();
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: `
          <div style="font-family:Arial;padding:18px">
            <h2>Resultado de registro</h2>
            <p><b>ID:</b> ${escapeHtml(id)}</p>
            <pre style="background:#f6f6f6;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(txt)}</pre>
            <p><a href="?id=${encodeURIComponent(id)}">↩ Volver</a></p>
          </div>
        `
      };
    }

    // Validación (GET) -> solo consulta
    const resp = await fetch(`${GOOGLE_SCRIPT_URL}?id=${encodeURIComponent(id)}`);
    const txt = await resp.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: `
        <div style="font-family:Arial;padding:18px">
          <h2>Validación de reserva</h2>
          <p><b>ID:</b> ${escapeHtml(id)}</p>
          <pre style="background:#f6f6f6;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(txt)}</pre>

          <hr/>
          <h3>👮 Solo personal</h3>
          <form method="GET" action="">
            <input type="hidden" name="id" value="${escapeHtml(id)}"/>
            <input type="hidden" name="confirm" value="1"/>
            <input name="personal" placeholder="Nombre del personal" style="padding:8px;width:220px"/>
            <br/><br/>
            <input name="pin" type="password" placeholder="PIN" style="padding:8px;width:220px"/>
            <br/><br/>
            <button type="submit" style="padding:10px 14px">Confirmar ingreso</button>
          </form>
        </div>
      `
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: `<h2>❌ Error</h2><pre>${escapeHtml(error.message)}</pre>`
    };
  }
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
