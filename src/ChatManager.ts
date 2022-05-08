import moment from "moment"
import { log } from "./Logging"

export class ChatManager {
    private messages: Message[] = []

    public getMessages() {
        return this.messages
    }

    public loadMessages(messages: Message[]) {
        this.messages = messages

        log("loaded %d messages into chat log", this.messages.length)
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
}

export interface Message {
    content: string
    fromSentinels: boolean
    timestamp: number
}
