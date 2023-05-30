"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const server = (0, fastify_1.default)({
    logger: true,
});
server.get("/", async (request, reply) => {
    reply.type("application/json").code(200);
    return { hello: "world" };
});
server.listen(3000, (err, address) => {
    if (err)
        throw err;
    server.log.info(`server listening on ${address}`);
});
