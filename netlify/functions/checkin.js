// ✅ URL REAL Apps Script (/exec)
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw3GIzb3TtHqY8VNEXyYLWcGnphswHEqkAtcB5T0KenL-gFOotr0m_LN__DMa3PIkuV/exec";

export async function handler(event) {
  try {
    const qs = event.queryStringParameters || {};
    const idQS = String(qs.id || qs.ID || "").trim();

    // ---------- POST ----------
    if (event.httpMethod === "POST") {
      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return html(400, `<h2>❌ JSON inválido</h2>`);
      }

      // asegurar ID
      if (!body.id && idQS) body.id = idQS;
      if (!body.id) {
        return html(400, `<h2>❌ Falta ID</h2>`);
      }

      // enviar ID también por querystring
      const postUrl = `${GOOGLE_SCRIPT_URL}?id=${encodeURIComponent(body.id)}`;

      const resp = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const txt = await resp.text();

      return html(200, `
        <h2>Resultado</h2>
        <p><b>Status Apps Script:</b> ${resp.status}</p>
        <p><b>ID:</b> ${esc(body.id)}</p>
        <p><b>Personal enviado:</b> ${esc(body.personal || "(vacío)")}</p>
        <pre style="background:#f6f6f6;padding:12px;border-radius:8px">${esc(txt)}</pre>
        <a href="?id=${encodeURIComponent(body.id)}">↩ Volver</a>
      `);
    }

    // ---------- GET ----------
    if (!idQS) {
      return html(400, `<h2>❌ Falta el parámetro id</h2>`);
    }

    const resp = await fetch(`${GOOGLE_SCRIPT_URL}?id=${encodeURIComponent(idQS)}`);
    const txt = await resp.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: pageHtml_(idQS, txt),
    };

  } catch (e) {
    return html(500, `<h2>❌ Error Netlify</h2><pre>${esc(e.message)}</pre>`);
  }
}

function pageHtml_(id, validationTxt) {
  return `
<div style="font-family:Arial;padding:18px;max-width:720px">
  <h2>Validación de reserva</h2>
  <p><b>ID:</b> ${esc(id)}</p>
  <pre style="background:#f6f6f6;padding:12px;border-radius:8px">${esc(validationTxt)}</pre>

  <hr/>
  <h3>👮 Solo personal (PIN + evidencia)</h3>

  <p><b>Firma del huésped</b>:</p>
  <canvas id="sig" width="520" height="180" style="border:1px solid #ccc;border-radius:10px"></canvas>
  <br/><button id="clearSig">Limpiar firma</button>

  <p><b>Cédula (Frente)</b>:</p>
  <input id="cedFront" type="file" accept="image/*" capture="environment"/>

  <p><b>Cédula (Reverso)</b>:</p>
  <input id="cedBack" type="file" accept="image/*" capture="environment"/>

  <p><b>Datos del personal</b>:</p>
  <input id="personal" autocomplete="off" placeholder="Nombre del personal" style="padding:8px;width:260px"/>
  <br/><br/>
  <input id="pin" type="password" placeholder="PIN" style="padding:8px;width:260px"/>

  <br/><br/>
  <button id="send">Confirmar ingreso</button>
  <p id="status"></p>
</div>

<script>
  const id = ${JSON.stringify(id)};

  const canvas = document.getElementById("sig");
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 2;
  let drawing=false;

  function pos(e){
    const r=canvas.getBoundingClientRect();
    const t=e.touches?.[0];
    return {x:(t?t.clientX:e.clientX)-r.left,y:(t?t.clientY:e.clientY)-r.top};
  }
  canvas.onmousedown=e=>{drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);}
  canvas.onmousemove=e=>{if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();}
  window.onmouseup=()=>drawing=false;
  canvas.ontouchstart=e=>{drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault();}
  canvas.ontouchmove=e=>{if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault();}
  canvas.ontouchend=()=>drawing=false;

  document.getElementById("clearSig").onclick=()=>ctx.clearRect(0,0,canvas.width,canvas.height);

  async function compress(file){
    const img=new Image();
    img.src=URL.createObjectURL(file);
    await img.decode();
    const s=Math.min(1,1200/img.width);
    const c=document.createElement("canvas");
    c.width=img.width*s; c.height=img.height*s;
    c.getContext("2d").drawImage(img,0,0,c.width,c.height);
    return c.toDataURL("image/jpeg",0.7);
  }

  document.getElementById("send").onclick=async()=>{
    const status=document.getElementById("status");
    status.textContent="Enviando...";

    // ✅ LECTURA ROBUSTA DEL NOMBRE
    const personalInput=document.getElementById("personal");
    const personal=(personalInput.value||personalInput.getAttribute("value")||"").trim();
    const pin=document.getElementById("pin").value.trim();

    if(!personal){status.textContent="Falta nombre del personal";return;}
    if(!pin){status.textContent="Falta PIN";return;}

    const f1=document.getElementById("cedFront").files[0];
    const f2=document.getElementById("cedBack").files[0];
    if(!f1||!f2){status.textContent="Falta cédula";return;}

    const payload={
      id,
      personal,
      pin,
      firmaDataUrl:canvas.toDataURL("image/png"),
      cedulaFrenteDataUrl:await compress(f1),
      cedulaReversoDataUrl:await compress(f2)
    };

    const resp=await fetch(location.pathname+location.search,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    document.open();document.write(await resp.text());document.close();
  };
</script>
`;
}

function html(code, body) {
  return {
    statusCode: code,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<div style="font-family:Arial;padding:18px">${body}</div>`
  };
}

function esc(s){
  return String(s??"").replace(/[&<>"']/g,c=>(
    {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]
  ));
}
