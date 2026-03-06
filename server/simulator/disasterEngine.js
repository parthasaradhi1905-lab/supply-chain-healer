const Redis = require("ioredis");
const redis = new Redis();
const crisisLibrary = require("./crisisLibrary");

function triggerDisaster(type) {
    const event = crisisLibrary[type];
    if (!event) {
        console.error(`Unknown crisis type: ${type}`);
        return null;
    }

    console.log(`[DisasterEngine] Triggering disaster: ${type} at ${event.location}`);

    redis.publish(
        "stream:disruptions",
        JSON.stringify(event)
    );

    // Also push to the ML Stream explicitly (using XADD if needed by ML later, but pub/sub for WebSocket)

    return event;
}

module.exports = { triggerDisaster };
