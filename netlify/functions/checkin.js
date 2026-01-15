export async function handler(event) {
  try {
    const id = event.queryStringParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "text/html" },
        body: `
          <h2>Falta el parámetro id</h2>
          <p>Ejemplo: ?id=FLS_0000343</p>
        `
      };
    }

    const GOOGLE_SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbwiCYtqBiznqttrW8Nx_iPoJpY_JMkSNOB-LX1MgKA08hsli41ZC1z6gpHPdWu7TaT0/exec";

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?id=${encodeURIComponent(id)}`);
    const result = await response.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `
        <h2>Check-in registrado correctamente</h2>
        <p>ID: <strong>${id}</strong></p>
        <p>${result}</p>
      `
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html" },
      body: `
        <h2>Error en el check-in</h2>
        <pre>${error.message}</pre>
      `
    };
  }
}
