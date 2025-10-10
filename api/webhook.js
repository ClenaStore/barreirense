export default async function handler(req, res) {
  try {
    const data = req.body;
    if (data.type === "payment" && data.data.id) {
      const resp = await fetch(process.env.SHEET_ENDPOINT + "?action=marcarPago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagamento_id: data.data.id })
      });
      console.log("Pagamento confirmado:", await resp.text());
    }
    res.status(200).send("ok");
  } catch (e) {
    console.error(e);
    res.status(500).send("erro");
  }
}
