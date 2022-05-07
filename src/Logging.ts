import moment from "moment"

export const log = (message: string, ...params: any[]) => {
    console.log(`[%s] ${message}`, moment().utc().format("DD/MM/YYYY HH:mm:ss"), ...params)
}
