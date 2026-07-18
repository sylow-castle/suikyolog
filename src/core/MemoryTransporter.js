import { Transporter } from "./Transporter.js";

export class MemoryTransporter extends Transporter {

    logs = [];

    /**
     * メモリーにログを保存する
     * @override
     * @param {string} payload 
     */
    async transport(payload) {
        this.logs.push(payload);
    }

    /**
     * logの内容が詰まった配列を返却します。
     * @returns {string[]}
     */
    getLogs() {
        return this.logs.slice();
    }
}