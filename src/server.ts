import "dotenv/config"
import express from "express"
import { createServer } from "http"
import path from "path"
import { Server } from "socket.io"

import { ChatManager } from "./ChatManager"
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

let chatManager = new ChatManager()

const io = new Server(http)

const roomName = "MainRoom"

const answers = process.env.ANSWERS?.split(";") ?? []
log("answers are %s", answers.join(", "))

const inputs = answers.map(_ => "")

const reveal = process.env.REVEAL ?? ""
log("reveal is %s", reveal)


const computeCurrentReveal = () => {
    let currentReveal = reveal

    for (let i = 0; i < currentReveal.length; i++) {
        if (inputs[i] !== answers[i]) {
            currentReveal = replace(currentReveal, i)
        }
    }

    return currentReveal
}

const replace = (str: string, index: number) => str.substring(0, index) + "?" + str.substring(index + 1)

io.on("connection", socket => {
    log("client connected on socket %s from %s", socket.id, socket.handshake.address)

    socket.join(roomName)

    socket.emit("inputs", inputs)
    socket.emit("reveal", computeCurrentReveal())
    socket.emit("chatLog", chatManager.getMessages())

    socket.on("newInput", (data: [string, number]) => {
        inputs[data[1]] = data[0]
        io.in(roomName).emit("inputs", inputs)
        io.in(roomName).emit("reveal", computeCurrentReveal())
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
