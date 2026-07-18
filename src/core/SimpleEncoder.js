import { Encoder } from "./Encoder.js";

/**
 * @implements {Encoder}
 */
export class SimpleEncoder extends Encoder {

    /**
     * @param {import("./SyslogStmt.js").SyslogStmt} syslogStmt
     */
    encode(syslogStmt) {
        const pri = syslogStmt.pri;
        const timestamp = new Date(syslogStmt.timestamp).toISOString();
        const rawMsg = syslogStmt.msg || "";
        const msg = Encoder.escapeControlChars(rawMsg);
        return `[${pri}] ${timestamp} ${msg}`;
    }
}