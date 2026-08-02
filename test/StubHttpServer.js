import { createServer } from "node:http";

const PORT = 30080;

const server = createServer((req, res) => {
  // CORSプリフライト（OPTIONS）対策（ブラウザ等からの呼び出し用）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /log のリクエストを受け付ける
  if (req.method === "POST" && req.url === "/log") {
    const chunks = [];

    // リクエストボディをストリームで受信
    req.on("data", (chunk) => chunks.push(chunk));

    req.on("end", () => {
      const bodyText = Buffer.concat(chunks).toString("utf-8");

      console.log(`[${new Date().toISOString()}] ログ受信:`, bodyText);

      // 送信元へ 200 OK を返す
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", receivedLength: bodyText.length }));
    });
  } else {
    // 該当しないパスやメソッドは 404 を返す
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`スタブサーバーが起動しました: http://localhost:${PORT}/log`);
});