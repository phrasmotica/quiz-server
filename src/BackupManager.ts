import { existsSync, readFile, writeFile } from "fs"
import moment from "moment"
import { duration } from "moment"
import path from "path"

import { ChatManager, Message } from "./ChatManager"
import { log } from "./Logging"

export class BackupManager {
    private readonly backupFilePath: string

    private backupTimer!: NodeJS.Timer | null

    public constructor(
        private chatManager: ChatManager,
    ) {
        this.backupFilePath = path.resolve("./public/backup.json")
        this.load()
    }

    public start(backupIntervalHours: number) {
        let backupIntervalMs = backupIntervalHours * 60 * 60 * 1000
        this.backupTimer = setInterval(() => this.backup(), backupIntervalMs)

        log("backup interval is %s", duration({ hours: backupIntervalHours }).humanize())
    }

    public stop() {
        if (this.backupTimer !== null) {
            clearInterval(this.backupTimer)
            this.backupTimer = null
        }

        log("backup timer stopped")
    }

    private backup() {
        this.writeBackupData()
    }

    private load() {
        if (existsSync(this.backupFilePath)) {
            this.readBackupData()
        }
        else {
            log("no backup file exists, creating...")
            this.writeBackupData()
        }
    }

    private createBackupData() {
        return {
            timestamp: moment().utc().unix(),
            chatLog: this.chatManager.getMessages(),
        } as BackupData
    }

    private writeBackupData() {
        let backupData = this.createBackupData()

        writeFile(this.backupFilePath, JSON.stringify(backupData), err => {
            if (err != null) {
                log("failed to back up data! Error: %s", err.message)
            }
            else {
                log("backed up data, including %d messages from chat log", backupData.chatLog.length)
            }
        })
    }

    private readBackupData() {
        readFile(this.backupFilePath, (err, data) => {
            if (err != null) {
                log("failed to load backup data! Error: %s", err.message)
            }
            else {
                let contents = JSON.parse(data.toString()) as BackupData
                this.chatManager.loadMessages(contents.chatLog)
            }
        })
    }
}

interface BackupData {
    timestamp: number
    chatLog: Message[]
}
