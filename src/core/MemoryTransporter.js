import { SyslogStmt } from "./SyslogStmt.js";
import { Transporter } from "./Transporter.js";

export class MemoryTransporter extends Transporter {

    logs = [];

    /**
     * メモリーにログを保存する
     * @override
     * @param {SyslogStmt} payload 
     */
    async transport(payload) {
        this.logs.push(payload);
    }

    setEncoder(encoder) {}

    /**
     * logの内容が詰まった配列を返却します。
     * @returns {string[]}
     */
    getLogs() {
        return this.logs.slice();
    }
}