export async function POST(request) {
  try {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return Response.json(
        { ok: false, error: "Server secrets are missing." },
        { status: 500 }
      );
    }

    const form = await request.formData();

    const receipt = form.get("receipt");
    const game = clean(form.get("game"));
    const userId = clean(form.get("userId"));
    const zoneId = clean(form.get("zoneId"));
    const aid = clean(form.get("aid"));
    const server = clean(form.get("server"));
    const packageName = clean(
  form.get("packageName") || form.get("package")
);
    const quantity = clean(form.get("quantity"));
    const total = clean(form.get("total"));

    if (!(receipt instanceof File) || receipt.size === 0) {
      return Response.json(
        { ok: false, error: "Receipt image is required." },
        { status: 400 }
      );
    }

    if (!game || !packageName || !total) {
  return Response.json(
    { ok: false, error: "Order information is incomplete." },
    { status: 400 }
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
      `Total: ${total}`,
    ].filter(Boolean);

    const telegramForm = new FormData();

    telegramForm.append("chat_id", CHAT_ID);
    telegramForm.append("caption", lines.join("\n"));
    telegramForm.append(
      "photo",
      receipt,
      receipt.name || "receipt.jpg"
    );

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        body: telegramForm,
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramData.ok) {
      console.error("Telegram error:", telegramData);

      return Response.json(
        {
          ok: false,
          error:
            telegramData.description || "Telegram request failed.",
        },
        { status: 502 }
      );
    }

    return Response.json({
      ok: true,
      message: "Order sent successfully.",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { ok: false, error: "Server error." },
      { status: 500 }
    );
  }
}

export function GET() {
  return Response.json({
    ok: true,
    message: "AL Gamepay API is running.",
  });
}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, 500);
}
