// ✅ Pega aquí tu URL real del Apps Script (debe terminar en /exec)
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw3GIzb3TtHqY8VNEXyYLWcGnphswHEqkAtcB5T0KenL-gFOotr0m_LN__DMa3PIkuV/exec"

export async function handler(event) {
  try {
    const qs = event.queryStringParameters || {};
    const id = String(qs.id || qs.ID || "").trim();

    // ---------- POST: enviar evidencia + pin ----------
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");

      // Validación mínima
      if (!body || !body.id) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
          body: `<h2>❌ Falta data del formulario</h2>`
        };
      }

      const resp = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const txt = await resp.text();

      return {
        statusCode: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: `
          <div style="font-family:Arial;padding:18px">
            <h2>Resultado</h2>
            <pre style="background:#f6f6f6;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(txt)}</pre>
            <p><a href="?id=${encodeURIComponent(body.id || "")}">↩ Volver</a></p>
          </div>
        `
      };
    }

    // ---------- GET: validación ----------
    if (!id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: `<h2>❌ Falta el parámetro id</h2><p>Ejemplo: ?id=FLS_0000343</p>`
      };
    }

    const resp = await fetch(`${GOOGLE_SCRIPT_URL}?id=${encodeURIComponent(id)}`);
    const txt = await resp.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: pageHtml_(id, txt)
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: `<h2>❌ Error Netlify</h2><pre>${esc(e.stack || e.message)}</pre>`
    };
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

    <p><b>Firma del huésped</b> (firme con el dedo):</p>
    <canvas id="sig" width="520" height="180" style="border:1px solid #ccc;border-radius:10px;touch-action:none"></canvas>
    <div style="margin-top:8px">
      <button id="clearSig" type="button" style="padding:8px 12px">Limpiar firma</button>
    </div>

    <p style="margin-top:18px"><b>Cédula (Frente)</b>:</p>
    <input id="cedFront" type="file" accept="image/*" capture="environment"/>

    <p style="margin-top:12px"><b>Cédula (Reverso)</b>:</p>
    <input id="cedBack" type="file" accept="image/*" capture="environment"/>

    <p style="margin-top:18px"><b>Datos del personal</b>:</p>
    <input id="personal" placeholder="Nombre del personal" style="padding:8px;width:260px"/>
    <br/><br/>
    <input id="pin" type="password" placeholder="PIN" style="padding:8px;width:260px"/>

    <br/><br/>
    <button id="send" type="button" style="padding:10px 14px">Confirmar ingreso</button>

    <p id="status" style="margin-top:12px;color:#444"></p>
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
      const touch = e.touches && e.touches[0];
      const clientX = touch ? touch.clientX : e.clientX;
      const clientY = touch ? touch.clientY : e.clientY;
      return { x: clientX - r.left, y: clientY - r.top };
    }

    function start(e){ drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); }
    function move(e){ if(!drawing) return; const p=getPos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault(); }
    function end(){ drawing=false; }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);

    canvas.addEventListener("touchstart", start, {passive:false});
    canvas.addEventListener("touchmove", move, {passive:false});
    canvas.addEventListener("touchend", end);

    document.getElementById("clearSig").onclick = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
    };

    // ✅ comprimir imagen (evita Internal Error por tamaño)
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
      const cctx = c.getContext("2d");
      cctx.drawImage(img, 0, 0, w, h);

      URL.revokeObjectURL(img.src);
      return c.toDataURL("image/jpeg", quality);
    }

    document.getElementById("send").onclick = async () => {
      const status = document.getElementById("status");
      status.textContent = "Enviando...";

      const personal = document.getElementById("personal").value.trim();
      const pin = document.getElementById("pin").value.trim();
      const f1 = document.getElementById("cedFront").files[0];
      const f2 = document.getElementById("cedBack").files[0];

      if(!personal){ status.textContent = "Falta nombre del personal"; return; }
      if(!pin){ status.textContent = "Falta PIN"; return; }
      if(!f1 || !f2){ status.textContent = "Falta foto de cédula (frente y reverso)"; return; }

      const firmaDataUrl = canvas.toDataURL("image/png");
      const cedulaFrenteDataUrl = await fileToCompressedDataUrl(f1, 1200, 0.7);
      const cedulaReversoDataUrl = await fileToCompressedDataUrl(f2, 1200, 0.7);

      const payload = { id, personal, pin, firmaDataUrl, cedulaFrenteDataUrl, cedulaReversoDataUrl };

      const resp = await fetch(window.location.href, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });

      const html = await resp.text();
      document.open(); document.write(html); document.close();
    };
  </script>
  `;
}

function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

