import mysql2 from "mysql2";
import {DB_HOST, DB_USER, DB_PWD, DB_DATABASE} from "$env/static/private";

const connection = mysql2.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PWD,
    database: DB_DATABASE,
});

connection.connect((err) => {
    if (err) {
        console.error("DB connection error:", err);
        return;
    }
    console.log("Connected to MySQL!");
});

export function runDBCommand(sqlQuery: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
        // @ts-ignore
        connection.query(sqlQuery, params, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}