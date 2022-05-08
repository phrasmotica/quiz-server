import { readFile, writeFile } from "fs"
import moment, { duration } from "moment"
import path from "path"
import { log } from "./Logging"

export class ChatManager {
    private readonly chatLogFile = "./public/chatLog.json"

    private messages: Message[] = []

    public constructor(backupIntervalHours: number) {
        this.load()

        let backupIntervalMs = backupIntervalHours * 60 * 60 * 1000
        setInterval(() => this.backup(), backupIntervalMs)

        log("backup interval is %s", duration({ hours: backupIntervalHours }).humanize())
    }

    public getMessages() {
        return this.messages
    }

    public pushPlayersMessage(message: string) {
        this.messages.push({
            content: message,
            fromSentinels: false,
            timestamp: moment().unix()
        })
    }

    public pushSentinelsMessage(message: string) {
        this.messages.push({
            content: message,
            fromSentinels: true,
            timestamp: moment().unix()
        })
    }

    private backup() {
        let resolvedPath = path.resolve(this.chatLogFile)

        let timestamp = moment().utc()
        let messages = this.getMessages()

        let content = JSON.stringify({
            timestamp: timestamp.unix(),
            chatLog: messages,
        })

        writeFile(resolvedPath, content, err => {
            if (err != null) {
                log("failed to back up chat log! Error: %s", err.message)
            }
            else {
                log("backed up %d messages from chat log", messages.length)
            }
        })
    }

    private load() {
        let resolvedPath = path.resolve(this.chatLogFile)

        readFile(resolvedPath, (err, data) => {
            if (err != null) {
                log("failed to load chat log! Error: %s", err.message)
            }
            else {
                let contents = JSON.parse(data.toString()) as ChatLog
                this.messages = contents.chatLog

                log("loaded %d messages into chat log", this.messages.length)
            }
        })
    }
}

interface ChatLog {
    timestamp: number
    chatLog: Message[]
}

interface Message {
    content: string
    fromSentinels: boolean
    timestamp: number
}
