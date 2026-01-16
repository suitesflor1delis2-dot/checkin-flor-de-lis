// netlify/functions/checkin.js

const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbznzmdsNzjEpqCUoy0KcOKkTunU_RDJClTAKRd8xjFN1iTpAWQR-BRTHgdTwtmgV93Z/exec";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const response = await fetch(WEBAPP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: event.body,
  });

  const text = await response.text();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: text,
  };
};
