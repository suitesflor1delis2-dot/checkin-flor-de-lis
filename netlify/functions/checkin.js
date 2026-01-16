// ✅ URL REAL Apps Script (/exec)
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzV2O-DGuK9xMeTJ3zvg0kE6pKbg7qN04hnUIy9VGQTePlex8miwj5HaxWY64W0FHPQ/exec";

export async function handler(event) {
  try {
    const qs = event.queryStringParameters || {};
    const idQS = String(qs.id || qs.ID || "").trim();

    // ---------- POST ----------
    if (event.httpMethod === "POST") {
      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch (err) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ ok: false, error: "JSON inválido", detail: err.message }),
        };
      }

      // ✅ asegurar campos mínimos
      if (!body.id && idQS) body.id = idQS;
      body.id = String(body.id || "").trim();
      body.personal = String(body.personal || "").trim();
      body.pin = String(body.pin || "").trim();

      if (!body.id) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ ok: false, error: "Falta ID" }),
        };
      }
      if (!body.personal) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ ok: false, error: "Falta nombre del personal" }),
        };
      }
      if (!body.pin) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ ok: false, error: "Falta PIN" }),
        };
      }

      // ✅ CLAVE: mandar id + personal + pin también en querystring a Apps Script
      const postUrl =
        `${GOOGLE_SCRIPT_URL}?id=${encodeURIComponent(body.id)}&personal=${encodeURIComponent(body.personal)}&pin=${encodeURIComponent(body.pin)}`;

      const resp = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // ✅ Apps Script devuelve JSON (incluye pdf_url)
      let out = null;
      try {
        out = await resp.json();
      } catch (err) {
        const txt = await resp.text();
        out = { ok: false, error: "Apps Script no devolvió JSON", raw: txt };
      }

      // Agrega status para debug
      out.apps_status = resp.status;

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(out),
      };
    }

    // ---------- GET ----------
    if (!idQS) {
      return html(400, `<h2>❌ Falta el parámetro id</h2><p>Ejemplo: ?id=FLS_0000343</p>`);
    }

    const resp = await fetch(`${GOOGLE_SCRIPT_URL}?id=${encodeURIComponent(idQS)}`);
    const txt = await resp.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: pageHtml_(idQS, txt),
    };
  } catch (e) {
    return html(500, `<h2>❌ Error Netlify</h2><pre>${esc(e.stack || e.message)}</pre>`);
  }
}

function pageHtml_(id, validationTxt) {
  return `
  <div style="font-family:Arial;padding:18px;max-width:720px">
    <h2>Validación de reserva</h2>
    <p><b>ID:</b> ${esc(id)}</p>
    <pre style="background:#f6f6f6;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(validationTxt)}</pre>

    <hr/>
    <h3>👮 Solo personal (PIN + evidencia)</h3>

    <p><b>Firma del huésped</b>:</p>
    <canvas id="sig" width="520" height="180" style="border:1px solid #ccc;border-radius:10px;touch-action:none"></canvas>
    <div style="margin-top:8px">
      <button id="clearSig" type="button" style="padding:8px 12px">Limpiar firma</button>
    </div>

    <p style="margin-top:18px"><b>Cédula (Frente)</b>:</p>
    <input id="cedFront" type="file" accept="image/*" capture="environment"/>

    <p style="margin-top:12px"><b>Cédula (Reverso)</b>:</p>
    <input id="cedBack" type="file" accept="image/*" capture="environment"/>

    <p style="margin-top:18px"><b>Datos del personal</b>:</p>
    <input id="personal" placeholder="Nombre del personal" autocomplete="off" style="padding:8px;width:260px"/>
    <br/><br/>
    <input id="pin" type="password" placeholder="PIN" style="padding:8px;width:260px"/>

    <br/><br/>
    <button id="send" type="button" style="padding:10px 14px">Confirmar ingreso</button>

    <p id="status" style="margin-top:12px;color:#444"></p>
    <p id="pdfLink" style="margin-top:8px;"></p>
  </div>

  <script>
    const id = ${JSON.stringify(id)};

    // --- firma canvas ---
    const canvas = document.getElementById("sig");
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;

    let drawing = false;
    function getPos(e) {
      const r = canvas.getBoundingClientRect();
      const t = e.touches && e.touches[0];
      const x = (t ? t.clientX : e.clientX) - r.left;
      const y = (t ? t.clientY : e.clientY) - r.top;
      return {x,y};
    }
    function start(e){ drawing=true; const p=getPos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); }
    function move(e){ if(!drawing) return; const p=getPos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault(); }
    function end(){ drawing=false; }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);

    canvas.addEventListener("touchstart", start, {passive:false});
    canvas.addEventListener("touchmove", move, {passive:false});
    canvas.addEventListener("touchend", end);

    document.getElementById("clearSig").onclick = () => ctx.clearRect(0,0,canvas.width,canvas.height);

    async function fileToCompressedDataUrl(file, maxW = 1200, quality = 0.7) {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = URL.createObjectURL(file);
      });

      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);

      URL.revokeObjectURL(img.src);
      return c.toDataURL("image/jpeg", quality);
    }

    document.getElementById("send").onclick = async () => {
      const status = document.getElementById("status");
      const pdfLink = document.getElementById("pdfLink");
      status.textContent = "Enviando...";
      pdfLink.innerHTML = "";

      const personal = (document.getElementById("personal").value || "").trim();
      const pin = (document.getElementById("pin").value || "").trim();
      const f1 = document.getElementById("cedFront").files[0];
      const f2 = document.getElementById("cedBack").files[0];

      if(!personal){ status.textContent = "Falta nombre del personal"; return; }
      if(!pin){ status.textContent = "Falta PIN"; return; }
      if(!f1 || !f2){ status.textContent = "Falta foto de cédula (frente y reverso)"; return; }

      const payload = {
        id,
        personal,
        pin,
        firmaDataUrl: canvas.toDataURL("image/png"),
        cedulaFrenteDataUrl: await fileToCompressedDataUrl(f1, 1200, 0.7),
        cedulaReversoDataUrl: await fileToCompressedDataUrl(f2, 1200, 0.7)
      };

      const postUrl = window.location.pathname + window.location.search;

      const resp = await fetch(postUrl, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });

      const out = await resp.json();

      if (!out.ok) {
        status.textContent = (out.error || out.message || "Error") + (out.apps_status ? (" (Apps: " + out.apps_status + ")") : "");
        return;
      }

      status.textContent = "✅ Check-in completado. Abriendo PDF...";

      if (out.pdf_url) {
        // Abre el PDF automáticamente
        window.open(out.pdf_url, "_blank");

        // También deja un link visible por si el navegador bloquea popups
        pdfLink.innerHTML = '<a href="' + out.pdf_url + '" target="_blank">📄 Abrir/Descargar PDF</a>';
      } else {
        status.textContent = "✅ Check-in guardado, pero no llegó pdf_url.";
      }
    };
  </script>
  `;
}

function html(code, body) {
  return {
    statusCode: code,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<div style="font-family:Arial;padding:18px">${body}</div>`,
  };
}

function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
