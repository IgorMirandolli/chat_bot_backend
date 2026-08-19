export function getHealth(_request, response) {
  response.json({
    status: "ok",
    application: "CineMatch API",
    timestamp: new Date().toISOString(),
  });
}
