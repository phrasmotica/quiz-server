import { existsSync, readFile, writeFile } from "fs"
import moment from "moment"
import { duration } from "moment"
import path from "path"

import { ChatManager, Message } from "./ChatManager"
import { InputManager } from "./InputManager"
import { log } from "./Logging"

export class BackupManager {
    private readonly backupFilePath: string

    private backupTimer!: NodeJS.Timer | null

    public constructor(
        private readonly chatManager: ChatManager,
        private readonly inputManager: InputManager
    ) {
        this.backupFilePath = path.resolve("./public/backup.json")
    }

    public start(backupIntervalHours: number) {
        this.load()

        let backupIntervalMs = backupIntervalHours * 60 * 60 * 1000
        backupIntervalMs = 10000
        this.backupTimer = setInterval(() => this.backup(), backupIntervalMs)

        let humanised = duration({ milliseconds: backupIntervalMs }).humanize()
        log("backup interval is %s", humanised)
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
            inputs: this.inputManager.getInputs(),
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
                log("backed up data: %d input(s), %d chat log message(s)", backupData.inputs.length, backupData.chatLog.length)
            }
        })
    }

    private readBackupData() {
        readFile(this.backupFilePath, (err, data) => {
            if (err != null) {
                log("failed to load backup data! Error: %s", err.message)
            }
            else {
                let backupData = JSON.parse(data.toString()) as BackupData

                this.chatManager.loadMessages(backupData.chatLog)
                this.inputManager.loadInputs(backupData.inputs)

                log("loaded backup data: %d input(s), %d chat log message(s)", backupData.inputs.length, backupData.chatLog.length)
            }
        })
    }
}

interface BackupData {
    timestamp: number
    inputs: string[]
    chatLog: Message[]
}
