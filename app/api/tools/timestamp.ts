import moment from "moment-timezone";

const timeZone = "Europe/Zurich";

export const getCurrentTimestampISO = () =>
    moment().tz(timeZone).format("YYYY-MM-DD HH:mm:ss");

export const getCurrentTimestampFormatted = () =>
    moment().tz(timeZone).format("DD.MM.YYYY HH:mm:ss (Z)");
