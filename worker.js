export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API endpoint
    if (url.pathname === "/api/order" && request.method === "POST") {
      try {
        if (!env.BOT_TOKEN || !env.CHAT_ID) {
          return jsonResponse(
            { ok: false, error: "Server secrets are not configured." },
            500
          );
        }

        const form = await request.formData();

        const receipt = form.get("receipt");
        const game = clean(form.get("game"));
        const userId = clean(form.get("userId"));
        const zoneId = clean(form.get("zoneId"));
        const aid = clean(form.get("aid"));
        const server = clean(form.get("server"));
        const packageName = clean(form.get("package"));
        const quantity = clean(form.get("quantity"));
        const total = clean(form.get("total"));

        if (!receipt || !(receipt instanceof File)) {
          return jsonResponse(
            { ok: false, error: "Receipt image is required." },
            400
          );
        }

        if (!game || !packageName || !total) {
          return jsonResponse(
            { ok: false, error: "Order information is incomplete." },
            400
          );
        }

        const lines = [
          "🎮 NEW TOP-UP ORDER",
          "",
          `Game: ${game}`,
          userId ? `User ID: ${userId}` : "",
          zoneId ? `Zone ID: ${zoneId}` : "",
          aid ? `AID: ${aid}` : "",
          server ? `Server: ${server}` : "",
          "",
          `Package: ${packageName}`,
          `Quantity: ${quantity || "1"}`,
          `Total: ${total}`
        ].filter(Boolean);

        const telegramForm = new FormData();
        telegramForm.append("chat_id", env.CHAT_ID);
        telegramForm.append("caption", lines.join("\n"));
        telegramForm.append(
          "photo",
          receipt,
          receipt.name || "receipt.jpg"
        );

        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`,
          {
            method: "POST",
            body: telegramForm
          }
        );

        const telegramData = await telegramResponse.json();

        if (!telegramResponse.ok || !telegramData.ok) {
          console.error("Telegram error:", telegramData);

          return jsonResponse(
            {
              ok: false,
              error: telegramData.description || "Telegram send failed."
            },
            502
          );
        }

        return jsonResponse({
          ok: true,
          message: "Order sent successfully."
        });

      } catch (error) {
        console.error(error);

        return jsonResponse(
          {
            ok: false,
            error: "Server error."
          },
          500
        );
      }
    }

    // Serve existing website files
    return env.ASSETS.fetch(request);
  }
};

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, 500);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
        }
