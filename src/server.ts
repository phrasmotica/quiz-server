import "dotenv/config"
import express from "express"
import { createServer } from "http"
import path from "path"
import { Server } from "socket.io"

import { BackupManager } from "./BackupManager"
import { ChatManager } from "./ChatManager"
import { InputManager } from "./InputManager"
import { log } from "./Logging"

const app = express()
app.set("port", process.env.PORT || 5000)

// enable CSS in index.html
app.use(express.static(path.resolve("./public")))

let http = createServer(app)

app.get("/play", (_req, res) => {
    res.sendFile(path.resolve("./public/players.html"))
})

app.get("/oversee", (_req, res) => {
    res.sendFile(path.resolve("./public/sentinels.html"))
})

const chatManager = new ChatManager()

const backupIntervalHours = Number(process.env.BACKUP_INTERVAL_HOURS ?? 1)
const backupManager = new BackupManager(chatManager)
backupManager.start(backupIntervalHours)

const io = new Server(http)

const roomName = "MainRoom"

const answers = process.env.ANSWERS?.split(";") ?? []
log("answers are %s", answers.join(", "))

const reveal = process.env.REVEAL ?? ""
log("reveal is %s", reveal)

const inputManager = new InputManager(answers, reveal)

io.on("connection", socket => {
    log("client connected on socket %s from %s", socket.id, socket.handshake.address)

    socket.join(roomName)

    socket.emit("inputs", inputManager.getInputs())
    socket.emit("reveal", inputManager.getCurrentReveal())

    socket.emit("chatLog", chatManager.getMessages())

    socket.on("newInput", (data: [string, number]) => {
        inputManager.setInput(data[0], data[1])

        io.in(roomName).emit("inputs", inputManager.getInputs())
        io.in(roomName).emit("reveal", inputManager.getCurrentReveal())
    })

    socket.on("newPlayersMessage", (message: string) => {
        if (message.length > 0) {
            log("received new message from the players")

            chatManager.pushPlayersMessage(message)

            io.in(roomName).emit("chatLog", chatManager.getMessages())
        }
    })

    socket.on("newSentinelsMessage", (message: string) => {
        if (message.length > 0) {
            log("received new message from the Sentinels")

            chatManager.pushSentinelsMessage(message)

            io.in(roomName).emit("chatLog", chatManager.getMessages())
        }
    })

    socket.on("disconnect", () => {
        log("client disconnected on socket %s", socket.id)
        socket.leave(roomName)
        socket.disconnect()
    })
})

http.listen(5000, () => {
    log("listening on *:5000")
})
