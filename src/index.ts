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

// WebSocketを通じて他の参加者にユーザー一覧の更新を通知する関数
function notifyRoomUserListUpdate(room: Room) {
  const message = {
    type: "onRoomUserListUpdate",
    users: room.users,
  };

  const stringifiedMessage = JSON.stringify(message);

  app.websocketServer.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(stringifiedMessage);
    }
  });
}

// /create-room ルートを追加
app.route({
  method: "POST",
  url: "/create-room",
  handler: (request, reply) => {
    try {
      // 部屋を作成し、部屋情報を追加する
      const { userId, username } = request.body as {
        userId: string;
        username: string;
      };

      const room: Room = {
        roomId: generateUUID(),
        ownerId: userId,
        users: [
          {
            userId: userId,
            username: username,
          },
        ],
      };
      rooms.push(room);

      // レスポンスを返す
      reply.send(room);
    } catch (error) {
      reply.status(500).send({ error: "Internal Server Error" });
    }
  },
});

// /join-room ルートを追加
app.route({
  method: "POST",
  url: "/join-room",
  handler: (request, reply) => {
    try {
      // 部屋を見つけるか作成し、ユーザーを部屋に追加する
      const { roomId, userId, username } = request.body as {
        roomId: string;
        userId: string;
        username: string;
      };
      let room: Room | undefined = rooms.find((r) => r.roomId === roomId);

      if (!room) {
        // 部屋が存在しない場合はエラーレスポンスを返す
        reply.status(404).send({ error: "Room not found" });
        return;
      }

      const user: User = {
        userId,
        username,
      };
      room.users.push(user);

      // WebSocketを通じて他の参加者にユーザー一覧の更新を通知する
      notifyRoomUserListUpdate(room);

      // レスポンスを返す
      reply.send(room);
    } catch (error) {
      reply.status(500).send({ error: "Internal Server Error" });
    }
  },
});

// WebSocket接続のハンドラ関数
app.get(
  "/room-users/:roomId/ws",
  { websocket: true },
  (connection, request) => {
    const { roomId } = request.params as { roomId: string };

    // 部屋を見つける
    const room: Room | undefined = rooms.find((r) => r.roomId === roomId);

    if (!room) {
      // 部屋が存在しない場合はエラーレスポンスを返す
      connection.socket.send(JSON.stringify({ error: "Room not found" }));
      connection.socket.close();
      return;
    }

    // WebSocket接続を確立したユーザーを部屋に追加する
    const userId = generateUUID();
    const username = `User ${userId.substr(0, 4)}`;
    const user: User = {
      userId,
      username,
    };
    room.users.push(user);

    // WebSocket接続のイベントハンドラを定義する
    connection.socket.on("message", (message) => {
      // メッセージを受信した場合の処理を記述する
      // ここでは特に何も行わない
    });

    connection.socket.on("close", () => {
      // WebSocket接続が閉じられた場合の処理を記述する
      // 部屋からユーザーを削除し、他の参加者にユーザー一覧の更新を通知する
      const index = room.users.findIndex((u) => u.userId === userId);
      if (index !== -1) {
        room.users.splice(index, 1);
        notifyRoomUserListUpdate(room);
      }
    });

    // 初期接続時にユーザー一覧を送信する
    const initialMessage = {
      type: "initialUserList",
      users: room.users,
    };
    connection.socket.send(JSON.stringify(initialMessage));

    // 他の参加者にユーザー一覧の更新を通知する
    notifyRoomUserListUpdate(room);
  }
);

// サーバーを起動する
app.listen({ port: 8000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening on ${address}`);
});
