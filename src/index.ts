import fastify, { FastifyInstance } from "fastify";
import fastifyWebSocket from "@fastify/websocket";
import cors from "@fastify/cors";

interface Room {
  roomId: string;
  ownerId: string;
  users: User[];
}

interface User {
  userId: string;
  username: string;
}

const app: FastifyInstance = fastify();
app.register(fastifyWebSocket);
app.register(cors, {
  origin: true, // すべてのオリジンを許可
});

let rooms: Room[] = []; // 部屋のリスト

// ユーティリティ関数: UUIDを生成する
function generateUUID(): string {
  // 実際のUUID生成ロジックに置き換えるか、ライブラリを使用する
  // ここでは単純にランダムな文字列を生成して返す例を示している
  return Math.random().toString(36).substr(2, 9);
}

app.get("/", { websocket: true }, (connection, req) => {
  console.log("fastify.get");
  connection.socket.on("message", (message) => {
    connection.socket.send("hi from server");
  });
});

// サーバーを起動する
app.listen({ port: 8000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening on ${address}`);
});
