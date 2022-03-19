const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const EventEmitter = require("events");
const crypto = require("crypto");

const app = express();
const port = 4000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:3000" },
});

process.on('uncaughtException', (err) => console.log(err));

app.use(cors());
app.get("/", () => { });

const pg = new Pool({
    host: process.env.MATERAILIZE_HOST || "localhost",
    port: 6875,
    user: "materialize",
    password: "materialize",
    database: "materialize",
});

pg.on("error", (err) => console.log(err));

/**
 * Set up Materialize db
 */
async function asyncSetUp() {
    try {
        console.log("Setting up Materialize..");
        const poolClient = await pg.connect();
        const query = await poolClient.query(`
        CREATE SOURCE IF NOT EXISTS ethereum_logs
        FROM KAFKA BROKER 'broker:29092' TOPIC 'ethereum_logs'
        WITH (kafka_time_offset = -1)
        FORMAT BYTES;
      `);
        const { rows } = query;
        const [row] = rows;
        console.log('Output: ', query, row);
    } catch (err) {
        console.log("Error setting up Materialize");
        console.log(err);
    }
}

/**
 * Give some time to feeder to create the topic
 */
setTimeout(() => {
    asyncSetUp();
}, 6000);


/**
 * Map room names with query's hash
 */
const queryHashMap = new Map();

function queryToHash(query) {
    const hash = crypto.createHash("sha256").update(query).digest("base64");
    return hash;
}

/**
 * Map to follow connections and tails
 */
const connectionEventEmitter = new EventEmitter();

/**
 * Query Materialize using tails
 * @param {String} roomName
 * @param {String} query
 */
async function tailQuery(roomName, query) {
    try {
        const trimmedQuery = query.trim();
        const cleanQuery = trimmedQuery.endsWith(";")
            ? trimmedQuery.substring(0, query.length - 2)
            : trimmedQuery;

        const poolClient = await pg.connect();
        const tailQuery = `BEGIN; DECLARE mz_cursor CURSOR FOR TAIL(
      ${cleanQuery}
    ) WITH (SNAPSHOT = false);`;

        await poolClient.query(tailQuery);
        let tailOpen = true;

        // Listen when to stop
        connectionEventEmitter.on(query, () => {
            tailOpen = false;
        });

        while (tailOpen) {
            try {
                const { rows } = await poolClient.query(
                    "FETCH ALL FROM mz_cursor WITH (TIMEOUT='1s');"
                );

                if (rows.length > 0) {
                    io.emit(roomName, rows);
                }
            } catch (queryErr) {
                console.log(queryErr);
            }
        }

        poolClient.release();
    } catch (connectError) {
        console.log(connectError);
        io.emit(roomName, connectError.toString());
    }
}

/**
 * Listen to rooms (Queries)
 */
io.of("/").adapter.on("create-room", (roomName) => {
    const query = queryHashMap.get(roomName);

    if (query) {
        console.log(`Tail (${roomName}) was created`);

        tailQuery(roomName, query);
    } else {
        console.log(`Oops. Query not found for room: ${roomName}`);
    }
});

io.of("/").adapter.on("delete-room", (roomName) => {
    console.log(`Tail (${roomName}) was deleted`);
    queryHashMap.delete(roomName);
});

/**
 * Listen to tails sockets
 */
io.on("connection", (socket) => {
    const { handshake } = socket;
    const { query: handshakeQuery } = handshake;
    const { query } = handshakeQuery;
    const queryRoomHash = queryToHash(query);
    queryHashMap.set(queryRoomHash, query);

    console.log("Socket connected: ", socket.id);
    console.log("Room name: ", queryRoomHash);
    socket.join(queryRoomHash);

    socket.on("disconnect", () => {
        console.log("Socket disconnected: ", socket.id);
        socket.leave(queryRoomHash);
    });
});

server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
