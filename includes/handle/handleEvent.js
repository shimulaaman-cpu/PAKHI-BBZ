module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    const moment = require("moment");

    // helper: normalize name
    const normalize = s => s?.toLowerCase().replace(/[^a-z0-9]/g, "");

    return function ({ event }) {
        const timeStart = Date.now();
        const time = moment.tz("Asia/Dhaka").format("HH:mm:ss L");
        const { userBanned, threadBanned } = global.data;
        const { events } = global.client;
        const { allowInbox, DeveloperMode } = global.config;

        let { senderID, threadID, body } = event;
        senderID = String(senderID);
        threadID = String(threadID);

        if (
            userBanned.has(senderID) ||
            threadBanned.has(threadID) ||
            (allowInbox === false && senderID === threadID)
        ) return;

        /* ================== MENTION LOGIC START ================== */
        event.mentionedIDs = [];

        // 1️⃣ official mention
        if (event.mentions && Object.keys(event.mentions).length > 0) {
            event.mentionedIDs = Object.keys(event.mentions);
        }

        // 2️⃣ reply mention
        else if (event.type === "message_reply" && event.messageReply?.senderID) {
            event.mentionedIDs = [String(event.messageReply.senderID)];
        }

        // 3️⃣ fallback @name resolver
        else if (body && body.includes("@")) {
            try {
                const tagMatches = [...body.matchAll(/@(.+?)(?=\s|$)/g)];
                if (tagMatches.length > 0) {
                    const threadInfo = await api.getThreadInfo(threadID);

                    for (const match of tagMatches) {
                        const tagName = normalize(match[1]);

                        const uid = threadInfo.participantIDs.find(id => {
                            const nickname = normalize(threadInfo.nicknames?.[id]);
                            const user = threadInfo.userInfo?.find(u => u.id == id);
                            const realName = normalize(user?.name);
                            return tagName === nickname || tagName === realName;
                        });

                        if (uid && !event.mentionedIDs.includes(uid)) {
                            event.mentionedIDs.push(uid);
                        }
                    }
                }
            } catch (e) {
                // silently ignore mention error
            }
        }
        /* ================== MENTION LOGIC END ================== */

        for (const [key, value] of events.entries()) {
            if (value.config.eventType.includes(event.logMessageType)) {
                const eventRun = events.get(key);
                try {
                    const Obj = {
                        api,
                        event,
                        models,
                        Users,
                        Threads,
                        Currencies
                    };

                    eventRun.run(Obj);

                    if (DeveloperMode === true) {
                        logger(
                            global.getText(
                                'handleEvent',
                                'executeEvent',
                                time,
                                eventRun.config.name,
                                threadID,
                                Date.now() - timeStart
                            ),
                            '[ Sự kiện ]'
                        );
                    }
                } catch (error) {
                    logger(
                        global.getText(
                            'handleEvent',
                            'eventError',
                            eventRun.config.name,
                            JSON.stringify(error)
                        ),
                        "error"
                    );
                }
            }
        }
    };
};
