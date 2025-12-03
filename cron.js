const moment = require('moment');
const cron = require('node-cron');
const fetch = require('node-fetch');
const mysql = require('mysql2/promise');
const CryptoJS = require('crypto-js');
const axios = require('axios');

require('dotenv').config();

const CRON_RUN_TYPE = process.env.CRON_RUN_TYPE;
const isSimulation = CRON_RUN_TYPE === 'simul';
const isUseTmpTbls = false;

// 임시 테스트 테이블
const tbl_subscribe_tb = isUseTmpTbls ? 'tmp_tb_subscribe_tb' : 'subscribe_tb';
const tbl_subscription = isUseTmpTbls ? 'tmp_tb_subscription' : 'subscription';
const tbl_license_group = isUseTmpTbls ? 'tmp_tb_license_group' : 'license_group';

const isLocal = process.env.NODE_ENV === 'local';

//console.log(process.env);
const host = process.env.DB_HOST || 'umodeler-db.mysql.database.azure.com';
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
const username = process.env.DB_USERNAME || 'agent';
const password = process.env.DB_PASSWORD || 'umodeler33!!!';
const database = process.env.DB_NAME || 'umodeler';

// XSOLLA
const MERCHANT_ID = Number(process.env.XSOLLA_MERCHANT_ID) || '257691';
const API_KEY = process.env.XSOLLA_API_KEY || '9f13c77df247b6a2b7966cc3d87ee9426a48b712';
const PROJECT_ID = Number(process.env.XSOLLA_PROJECT_ID || 184405);

console.log("[cron:start]", JSON.stringify({ CRON_RUN_TYPE, isSimulation, isUseTmpTbls, host, port, username, database, MERCHANT_ID, API_KEY, PROJECT_ID }));

const conn_pool = mysql.createPool({
    host: host,
    user: username,
    password: password,
    database: database,
    port: port,
    multipleStatements: true,
    connectionLimit: 20,
});
// 크론 매분

function decryptEmail(encryptedEmail) {
    const ciphertext = CryptoJS.enc.Base64.parse(encryptedEmail);
    const key = CryptoJS.enc.Utf8.parse('TRIPOLYGON-KEY09');
    const decrypted = CryptoJS.AES.decrypt(
        CryptoJS.lib.CipherParams.create({ ciphertext }),
        key,
        {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7,
        }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
}


function encryptEmail(email) {
    const lowerEmail = email.toLowerCase();
    const key = CryptoJS.enc.Utf8.parse('TRIPOLYGON-KEY09');
    const encrypted = CryptoJS.AES.encrypt(lowerEmail, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    });
    // encrypted.ciphertext는 WordArray이므로, 이를 Base64 문자열로 변환
    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

const sql_query = async (conn, sql, params = [], logging = true) => {
    const query_log = JSON.stringify({ sql, params }).replace(/\s+/g, ' ');
    if (logging) console.log("query: ", query_log);
    const [result, fields] = await conn.query(sql, params);
    // CUD
    // {
    //   result: ResultSetHeader {
    //     fieldCount: 0,
    //     affectedRows: 1,
    //     insertId: 0,
    //     info: 'Rows matched: 1  Changed: 0  Warnings: 0',
    //     serverStatus: 2,
    //     warningStatus: 0,
    //     changedRows: 0
    //   },
    //   fields: undefined
    // }
    return result;
}

const payfailSender = async (users, codes, endDate) => {
    try {
        console.log("[payfailSender]", moment().format('YYYY-MM-DD HH:mm:ss'));
        // dev: https://saas-dev-api.umodeler.com/user/payfailSender
        const resp = await axios.post(`http://localhost:5050/user/payfailSender`, {
            id: users?.id,
            codes: codes,
            enddate: moment(endDate).format('YYYY-MM-DD HH:mm:ss'),
        });
        // console.log(resp);
        console.log("[payfailSender] { user.id }:", users?.id);
    } catch (error) {
        console.log("[payfailSender] { user.id, error }:", users?.id, error.message);
    }
}

// 등록된 결제 수단 체크
const xsollaGetSavedAccounts = async (emails, cards) => {
    let url;
    try {
        if (!(cards?.accountId)) return [];

        // doc: https://developers.xsolla.com/api/pay-station/operation/get-saved-accounts/
        // user_id = emails + cards?.accountId
        // user_id이 없는 값이면 응답은 []
        url = `https://api.xsolla.com/merchant/v2/projects/${PROJECT_ID}/users/${emails}${cards?.accountId}/payment_accounts`;
        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Basic ' + Buffer.from(`${MERCHANT_ID}:${API_KEY}`).toString('base64')
            }
        });
        const { status, statusText } = resp;
        if (!(status < 300)) throw new Error(statusText);
        const savedAccounts = await resp.json();
        return savedAccounts;
    } catch (error) {
        console.error("[xsollaGetSavedAccounts] { message, card.idx, url }:", error.message, cards?.idx, url);
        return [];
    }
}

// 결제
const xsollaChargeWithSavedAccount = async (emails, cards, responsecard, x, showWon, simPrice) => {
    let url;
    try {
        // doc: https://developers.xsolla.com/api/pay-station/operation/charge-with-saved-account/#tag/tokenization/operation/charge-with-saved-account
        // user_id = emails + cards?.accountId
        // account_id = responsecard[0]?.id

        let amount = x?.pay_price;
        if (isSimulation) {
            if (simPrice > 0) amount = simPrice;
            if (isLocal) {
                // return { transaction_id: 1752900000, status: 'processing' }; // success
                // return {}; // failure
            }
        }

        url = `https://api.xsolla.com/merchant/v2/projects/${PROJECT_ID}/users/${emails}${cards?.accountId}/payments/card/${responsecard[0]?.id}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Basic ' + Buffer.from(`${MERCHANT_ID}:${API_KEY}`).toString('base64')
            },
            body: JSON.stringify({
                "purchase": {
                    "description": {
                        "value": "구독 결제"
                    },
                    "checkout": {
                        "currency": showWon,
                        // "amount": x?.pay_price
                        "amount": amount
                    }
                },
                "settings": {
                    "currency": showWon,
                    // "mode": "sandbox",
                    "save": true
                },
                "user": {
                    "ip": '20.55.53.182',
                    "name": emails
                }
            })
        });

        let { status, statusText } = resp;
        if (!(status < 300)) {
            try {
                const r = await resp.json();
                statusText = r.message || statusText;
                // This payment account does not belong to this user.
            } catch (error) {
            } finally {
                throw new Error(statusText);
            }
        }

        const result = await resp.json();
        // result: { transaction_id: 1752905299, status: 'processing' }
        return result;
    } catch (error) {
        console.error("[xsollaChargeWithSavedAccount] { message, card.idx, url }:", error.message, cards?.idx, url);
        return {};
    }
}

// 결제 실패 핸들러
const handlePayFailure = async (conn, x, subscription, users, nowMoment, payMoment, subsOriEndMoment) => {
    // actions
    // 1. 구독만료 처리 (구독만료시간 경과후)
    // - subscribe_tb.ingstate 갱신 (4: 구독만료)
    // - subscription.ingstate 갱신 (4: 구독만료)
    // - license_group.expiredAt 갱신

    // 2. 결제실패 처리 (구독만료시간 경과전)
    // - subscribe_tb.ingstate 갱신 (2: 결제실패)
    // - subscribe_tb.[pay_dt, delete_dt] 갱신
    // - subscription.endDate 갱신
    // - license_group.expiredAt 갱신
    // - payfailSender 실패메일 발송

    let sql;

    // 구독 만료 처리
    // [condition 4] pymt.delete_dt
    // subscribe_tb.ingstate => 2: 결제실패
    if (x?.ingstate * 1 === 2 && x?.delete_dt !== null) {
        const nowDate = nowMoment.clone(); // 기준일시
        const endDate = moment(x?.delete_dt); // 삭제일시

        // a.diff(b) = a - b [ 1 day : 86400000(ms) ]
        // a.diff(b, 'seconds') = a - b [ 1 day : 86400(s) ]
        // diffSec = endDate - nowDate (seconds)
        const diffSec = endDate.diff(nowDate, 'seconds');
        if (diffSec < 0) {
            console.log("[handlePayFailure] { user.id, subscriptionId, message }:", users?.id, x?.subscriptionId, "SUBSCRIPTION EXPIRATION");

            // subscribe_tb.ingstate => 4: 구독만료
            sql = `UPDATE ${tbl_subscribe_tb} SET ingstate='4' WHERE subscriptionId='${x?.subscriptionId}' AND ingstate IN (0, 2)`;
            await sql_query(conn, sql);

            // subscription.ingstate => 4: 구독만료
            sql = `UPDATE ${tbl_subscription} SET ingstate='4' WHERE id='${x?.subscriptionId}'`;
            await sql_query(conn, sql);

            sql = `UPDATE ${tbl_license_group} SET expiredAt='${nowMoment.format('YYYY-MM-DD HH:mm:ss')}' WHERE groupId='${subscription[0]?.licenseCode}'`;
            await sql_query(conn, sql);
            return;
        }
    }

    // 현재시간이 기준이 아니라, 원래 결제일 기준 (payMoment, subsOriEndMoment)
    const updatepayDate = payMoment.clone().add(5, 'days').format('YYYY-MM-DD HH:mm:ss'); // 5일 뒤로 수정
    // const updatepayDate = payMoment.clone().add(30, 'seconds').format('YYYY-MM-DD HH:mm:ss'); // 30초 뒤로 수정

    const deleteDate = subsOriEndMoment.clone().add(15, 'days').format('YYYY-MM-DD HH:mm:ss'); // 15일 뒤로 수정
    // const deleteDate = subsOriEndMoment.clone().add(90, 'seconds').format('YYYY-MM-DD HH:mm:ss'); // 90초 뒤로 수정

    if (x?.delete_dt === null) {
        console.log("[handlePayFailure] { user.id, subscriptionId, message }:", users?.id, x?.subscriptionId, "GRACE PERIOD FOR PAY FAILURE");

        // subscribe_tb.ingstate => 2: 결제실패
        // delete_dt: 구독결제 삭제일?
        sql = `UPDATE ${tbl_subscribe_tb} SET ingstate='2', pay_dt='${updatepayDate}', delete_dt='${deleteDate}' WHERE idx='${x?.idx}'`;
    } else {
        console.log("[handlePayFailure] { user.id, subscriptionId, message }:", users?.id, x?.subscriptionId, "PAY FAILURE");

        sql = `UPDATE ${tbl_subscribe_tb} SET ingstate='2', pay_dt='${updatepayDate}' WHERE idx='${x?.idx}'`;
    }
    await sql_query(conn, sql);

    if (x?.delete_dt === null) {
        // 구독 종료일 설정
        sql = `UPDATE ${tbl_subscription} SET endDate='${deleteDate}' WHERE id='${subscription[0]?.id}'`;
        await sql_query(conn, sql);

        // 라이선스 그룹 만료일 설정
        sql = `UPDATE ${tbl_license_group} SET expiredAt='${deleteDate}' WHERE groupId='${subscription[0]?.licenseCode}'`;
        await sql_query(conn, sql);
    }

    if (x?.delete_dt === null) {
        await payfailSender(users, subscription[0]?.licenseCode, deleteDate);
    } else {
        await payfailSender(users, subscription[0]?.licenseCode, x?.delete_dt);
    }
}

const getSimulationData = async (conn) => {
    const sql = `SELECT * FROM tmp_tb_simulation tts WHERE tts.is_active = 1 LIMIT 1`;
    const res = await sql_query(conn, sql, [], false);
    if (!res[0]) throw new Error("SimulationData");
    const { user_id: simUserId, now_date: simNow, price: simPrice } = res[0];
    return { simUserId, simNow, simPrice };
}

// Conditions for the logical branching
// 1. pymt.pay_dt <= now
// 2. pymt.ingstate in (0, 2)
// 3. subs.ingstate == 1
// 4. pymt.delete_dt

// subscription.ingstate => 0: 구독안함, 1: 구독중, 2: 결제실패, 3: 구독 해지, 4: 구독만료, 5: 해지신청, 9: 기타
// subscribe_tb.ingstate => 0: 예정, 1: 구독중, 2: 결제실패, 3: 구독 해지, 4: 구독만료, 9: 기타

let isRunning = false;
let lastHeartbeatTime = 0;
const HEARTBEAT_INTERVAL = 30 * 60 * 1000; // 30 min.

cron.schedule('*/10 * * * * *', async (now) => {
    if (isRunning) return;
    isRunning = true;

    let conn;
    try {
        let simUserId, simNow, simPrice; // for Simulation
        conn = await conn_pool.getConnection();
        if (isSimulation) ({ simUserId, simNow, simPrice } = await getSimulationData(conn));

        // [Main Logic Start]
        let nowMoment = moment(); // 기준 일시
        if (isSimulation) nowMoment = moment(simNow);

        const currentTime = Date.now();
        if ((currentTime - lastHeartbeatTime) >= HEARTBEAT_INTERVAL) {
            console.log('[cron:heartbeat]', nowMoment.format('YYYY-MM-DD HH:mm:ss'));
            lastHeartbeatTime = currentTime;
        }

        // subscribe_tb.ingstate => 0: 예정, 2: 결제실패
        // 최대 4개로 제한
        let nowDate = nowMoment.format('YYYY-MM-DD HH:mm:ss');
        // [condition 1] pymt.pay_dt <= now
        // [condition 2] pymt.ingstate in (0, 2)
        let sql = `
            SELECT st.* FROM ${tbl_subscribe_tb} AS st
            LEFT JOIN ${tbl_subscription} AS s ON st.subscriptionId = s.id
            WHERE st.pay_dt <= '${nowDate}' AND st.ingstate IN (0, 2)
                AND s.ingstate = 1
            ORDER BY st.ingstate DESC, st.pay_dt ASC
            LIMIT 5
        `;
        if (isSimulation) {
            sql = `
                SELECT st.* FROM ${tbl_subscribe_tb} AS st
                LEFT JOIN ${tbl_subscription} AS s ON st.subscriptionId = s.id
                WHERE st.pay_dt <= '${nowDate}' AND st.ingstate IN (0, 2)
                    AND s.ingstate = 1
                    AND st.userIdx IN (${simUserId})
                ORDER BY st.ingstate DESC, st.pay_dt ASC
                LIMIT 1`;
        }

        const result = await sql_query(conn, sql, [], false);

        if (result?.length > 0) {
            console.log('[cron:processing]', nowMoment.format('YYYY-MM-DD HH:mm:ss'), result?.length);
            for (const x of result) {
                // [Logic A Start]
                // x: row of subscribe_tb
                // - x.userIdx        : 사용자 ID
                // - x.subscriptionId : 구독 ID
                // - x.pay_dt         : 결제일 (instanceof Date) (pay_dt.toISOString())
                const user = await sql_query(conn, `SELECT * FROM account_data WHERE id='${x?.userIdx}'`);
                const card = await sql_query(conn, `SELECT * FROM card_tb WHERE accountId='${x?.userIdx}'`);
                const subscription = await sql_query(conn, `SELECT * FROM ${tbl_subscription} WHERE id='${x?.subscriptionId}'`);
                const failedPymt = await sql_query(conn, `SELECT * FROM ${tbl_subscribe_tb} WHERE subscriptionId='${x?.subscriptionId}' AND ingstate='2' LIMIT 1`);
                console.log("[subscribe_tb] { idx, ingstate, failedIdx }:", x?.idx, x?.ingstate, failedPymt[0]?.idx);
                // need to check user, card

                if (!subscription[0]?.id) {
                    // subscribe_tb.ingstate => 4: 구독만료
                    sql = `UPDATE ${tbl_subscribe_tb} SET ingstate='4' WHERE subscriptionId='${x?.subscriptionId}'`;
                    await sql_query(conn, sql);
                    continue;
                }
                // 결제실패가 존재하고, x가 결제실패건이 아닌 경우
                // 해당 구독에 결제실패건이 존재하면, 그것부터 처리
                if (failedPymt[0]?.idx && failedPymt[0]?.idx * 1 !== x?.idx * 1) {
                    continue;
                }
                // subscription.ingstate => 1: 구독중
                // [condition 3] subs.ingstate == 1
                if (subscription[0]?.ingstate * 1 !== 1) {
                    continue;
                }
                const showWon = subscription[0]?.showWon;
                const subsStartDate = subscription[0]?.startDate;
                const subsOriEndDate = subscription[0]?.oriEndDate;
                if (!subsOriEndDate) {
                    continue;
                }
                const subsOriEndMoment = moment(subsOriEndDate);
                const subsStartMoment = moment(subsStartDate);
                const payMoment = moment(x.pay_dt);

                let users = user[0];
                let cards = card[0];
                let emails = decryptEmail(users?.encrypted_email);

                // 등록된 결제 수단 체크
                const responsecard = await xsollaGetSavedAccounts(emails, cards);
                // 현재 API 로직상 사용자별 카드 1개만 등록 가능
                // responsecard[0].id == cards.carduserid == pymt.billkey
                // responsecard[0].name == cards.cardName == pymt.cardName

                if (responsecard?.length < 1) {
                    // [Logic A-1 Start]
                    // [case 2] 결제 수단 없음
                    console.log("[xsolla] { user.id, message }:", users?.id, "NO CARD");
                    await handlePayFailure(conn, x, subscription, users, nowMoment, payMoment, subsOriEndMoment);
                    continue;
                    // [Logic A-1 End]
                }

                // 결제
                // [Logic A-2 Start]
                const paymentresponse = await xsollaChargeWithSavedAccount(emails, cards, responsecard, x, showWon, simPrice);
                const billkey = responsecard[0]?.id;
                const cardName = responsecard[0]?.name;
                const paidDate = moment().format('YYYY-MM-DD HH:mm:ss');

                if (!paymentresponse?.transaction_id) {
                    // [case 3] 결제 실패
                    console.log("[xsolla] { user.id, message }:", users?.id, "PAYMENT FAILED");
                    await handlePayFailure(conn, x, subscription, users, nowMoment, payMoment, subsOriEndMoment);
                    continue;
                }

                // [case 1] 결제 성공
                // actions
                // - subscribe_tb.ingstate 갱신 (1: 구독중)
                // - subscribe_tb.[billkey, cardName] 갱신 [responsecard[0].id, responsecard[0].name]
                // - subscription.[endDate, oriEndDate] 갱신
                // - license_group.expiredAt 갱신

                // subscription.planYorM: 1: 월, 이외(2): 년
                console.log("[xsolla] { user.id, message }:", users?.id, "PAYMENT SUCCESS");
                let planPopRadioValue = subscription[0]?.planYorM;

                // 구독 만료일 연장, 원래 구독 종료일 기준 (subsOriEndMoment)
                // 31일자 복원 시도
                // 날짜 갱신 기준: 구독 시작일 (subsStartMoment), 구독 종료일 (subsOriEndMoment)
                const dt = subsStartMoment.format('DD HH:mm:ss'); // 구독 시작일 일, 시각
                const ym = subsOriEndMoment.clone().add(1, planPopRadioValue * 1 === 1 ? 'months' : 'year').format('YYYY-MM'); // 구독 원 종료일 년, 월
                const newOriEndMoment = moment(`${ym}-${dt}`); // 갱신할 구독 종료일 후보
                let newOriEndDate;
                if (newOriEndMoment.isValid()) {
                    newOriEndDate = newOriEndMoment.format('YYYY-MM-DD HH:mm:ss');
                } else {
                    // moment.clone().add(1, 'months') => 존재하지 않는 날짜면 알아서 월말로 변경 (1-31 12:34:56 => 2-28 12:34:56)
                    // newOriEndDate = subsOriEndMoment.clone().add(1, planPopRadioValue * 1 === 1 ? 'months' : 'year').format('YYYY-MM-DD HH:mm:ss');
                    // 31 - 28 - 30
                    newOriEndDate = moment(ym).endOf('month').format('YYYY-MM-DD') + " " + subsStartMoment.format('HH:mm:ss');
                }

                sql = `UPDATE ${tbl_subscribe_tb} SET ingstate='1', billkey='${billkey}', update_dt='${paidDate}', cardName='${cardName}' WHERE idx='${x?.idx}'`;
                await sql_query(conn, sql);

                // const newOriEndDate = subsOriEndMoment.clone().add(1, planPopRadioValue * 1 === 1 ? 'months' : 'year').format('YYYY-MM-DD HH:mm:ss');
                sql = `UPDATE ${tbl_subscription} SET endDate='${newOriEndDate}', oriEndDate='${newOriEndDate}' WHERE id='${x?.subscriptionId}'`;
                await sql_query(conn, sql);

                // 라이선스 그룹 만료일 연장, 원래 구독 종료일 기준 (subsOriEndMoment)
                sql = `UPDATE ${tbl_license_group} SET expiredAt='${newOriEndDate}' WHERE groupId='${subscription[0]?.licenseCode}'`;
                await sql_query(conn, sql);

                // [Logic A-2 End]
                // [Logic A End]
            }
        }

        // 구독중(1)이거나, 해지신청(5)인 경우 구독 종료일이 지나면 구독만료(4) 처리
        // subscription.ingstate => 1: 구독중, 3: 구독해지, 4: 구독만료, 5: 해지신청
        // subscribe_tb.ingstate => 0: 예정, 2: 결제실패, 3: 구독해지, 4: 구독만료
        sql = `SELECT * FROM ${tbl_subscription} WHERE endDate < '${nowMoment.format('YYYY-MM-DD HH:mm:ss')}' AND ingstate IN (1, 5)`;
        if (isSimulation) sql = sql + ` AND userId IN (${simUserId})`;
        const endedSubs = await sql_query(conn, sql, [], false);
        if (endedSubs?.length > 0) {
            console.log("[endedSubs] { Subscriptions }:", JSON.stringify(endedSubs.map(x => x?.id)));
            for (const x of endedSubs) {
                // x: row of subscription
                sql = `UPDATE ${tbl_subscription} SET ingstate='4' WHERE id='${x?.id}'`;
                await sql_query(conn, sql);

                sql = `UPDATE ${tbl_subscribe_tb} SET ingstate='4' WHERE subscriptionId='${x?.id}' AND ingstate IN (0, 2, 3)`;
                await sql_query(conn, sql);
            }
        }

        // subscription.ingstate => 1: 구독중
        // subscribe_tb.ingstate => 0: 예정
        // 구독중(1)인 구독과 결제예정(0) 또는 결제 실패(2) 구독결제의 존재여부 (has_pending_payment)

        // 로직 수정전
        // sql = `
        //     SELECT s.*, (
        //         SELECT idx FROM ${tbl_subscribe_tb} AS s1 WHERE s1.subscriptionId = s.id AND s1.ingstate='0' LIMIT 1
        //     ) AS s1_idx
        //     FROM ${tbl_subscription} AS s
        //     WHERE s.ingstate IN (1)`;

        // 모든 구독중인 구독을 다 가져온다. (비효율적)
        // sql = `
        //     SELECT s.*, CASE
        //         WHEN EXISTS (
        //             SELECT 1 FROM ${tbl_subscribe_tb} AS st
        //             WHERE st.subscriptionId = s.id AND st.ingstate IN (0, 2)
        //         ) THEN 1 ELSE 0
        //     END AS has_pending_payment
        //     FROM ${tbl_subscription} AS s
        //     WHERE s.ingstate IN (1)`;

        // 최종 개선 쿼리
        sql = `
            SELECT
                s.*
            FROM ${tbl_subscription} AS s
            WHERE s.ingstate IN (1)
                AND NOT EXISTS (
                    SELECT 1 FROM ${tbl_subscribe_tb} AS st
                    WHERE st.subscriptionId = s.id AND st.ingstate IN (0, 2)
                )`;
        if (isSimulation) sql = sql + ` AND s.userId IN (${simUserId})`;

        const noNextPaySubs = await sql_query(conn, sql, [], false);
        if (noNextPaySubs?.length > 0) {
            console.log("[noNextPaySubs] { Subscriptions }:", JSON.stringify(noNextPaySubs.map(x => x?.id)));
            for (const x of noNextPaySubs) {

                const subsStartDate = x?.startDate;
                const subsOriEndDate = x?.oriEndDate;
                const planPopRadioValue = x?.planYorM;
                if (!subsOriEndDate) continue;

                const subsStartMoment = moment(subsStartDate);
                const subsOriEndMoment = moment(subsOriEndDate);

                // [Logic B Start]
                // x: 구독 및 가장 이른 구독결제 idx (s1_idx)
                // x: row of subscription
                // 날짜 생성 기준: 구독 시작일 (subsStartMoment), 구독 종료일 (subsOriEndMoment)
                const dt = subsStartMoment.format('DD HH:mm:ss'); // 구독 시작일 일, 시각
                const loopCount = planPopRadioValue * 1 === 1 ? 6 : 2;
                for (let i = 0; i < loopCount; i++) {
                    const ym = subsOriEndMoment.clone().add(i, planPopRadioValue * 1 === 1 ? 'months' : 'year').format('YYYY-MM'); // 구독 원 종료일 년, 월
                    const newPayMoment = moment(`${ym}-${dt}`); // 결제일 후보
                    let newPayDate;
                    if (newPayMoment.isValid()) {
                        newPayDate = newPayMoment.format('YYYY-MM-DD HH:mm:ss');
                    } else {
                        newPayDate = moment(ym).endOf('month').format('YYYY-MM-DD') + " " + subsStartMoment.format('HH:mm:ss');
                    }

                    // 결제예정 추가
                    // 카드정보 미리 기입하는건 무의미 (결제 카드는 변경가능)
                    const sql = `
                        INSERT INTO ${tbl_subscribe_tb} SET
                            userIdx = ?,
                            billkey = '12345678',
                            pay_dt = ?,
                            pay_price = ?,
                            ingstate = '0',
                            subscriptionId = ?,
                            cardName = '123456******0000'`;
                    const params = [x?.userId, newPayDate, x?.ori_price, x?.id];
                    await sql_query(conn, sql, params);
                }
                // [Logic B End]
            }
        }
        // [Main Logic End]        
    } catch (error) {
        console.log("[cron:error]", error.message);
        console.error(error);
    } finally {
        if (conn) conn.release();
        isRunning = false;
    }
});