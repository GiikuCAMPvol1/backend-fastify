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
  console.log("fastify websocket connection...");
  connection.socket.on("message", (message) => {
    const data = JSON.parse(message.toString());

    // 部屋作成リクエスト
    if (data.type === "createRoom") {
      const { userId, username } = data.payload;

      // 新しい部屋を作成
      const roomId = generateUUID();
      const room: Room = {
        roomId,
        ownerId: userId,
        users: [],
      };
      rooms.push(room);

      // ユーザーを作成
      const user: User = {
        userId,
        username,
      };

      // ユーザーを作成した部屋に追加
      room.users.push(user);

      // 部屋作成成功メッセージを送信
      connection.socket.send(
        JSON.stringify({
          type: "createRoomSuccess",
          payload: {
            roomId,
            user,
          },
        })
      );
    }

    // 部屋参加リクエスト
    if (data.type === "joinRoom") {
      const { roomId, userId, username } = data.payload;

      // ルームが存在するかチェック
      const room = rooms.find((r) => r.roomId === roomId);
      if (!room) {
        // ルームが存在しない場合はエラーメッセージを送信
        connection.socket.send(
          JSON.stringify({
            type: "error",
            message: "Room not found",
          })
        );
        return;
      }

      // ユーザーを作成
      const user: User = {
        userId,
        username,
      };

      // ユーザーをルームに追加
      room.users.push(user);

      // 部屋参加成功メッセージを送信
      connection.socket.send(
        JSON.stringify({
          type: "joinRoomSuccess",
          payload: {
            roomId,
            user,
          },
        })
      );
    }
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
