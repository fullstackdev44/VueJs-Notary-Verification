import moment from "moment";

export default {
  methods: {
    getTimeZone(timezone) {
      let actualTimezone = "CST";
      switch (timezone) {
        case "5.5":
          actualTimezone = "GMT+05:30";
          break;
        case "-10":
          actualTimezone = "Hawaii";
          break;
        case "-8":
          actualTimezone = "Pacific";
          break;
        case "-7":
          actualTimezone = "MT";
          break;
        case "-6":
          actualTimezone = "CST";
          break;
        case "-5":
          actualTimezone = "EST";
          break;
        case "-4":
          actualTimezone = "Atlantic";
          break;
        default:
          actualTimezone;
      }
      return actualTimezone;
    },
    formatDate(rawDate, sessiondoc) {
      if (!rawDate) {
        return "Notarization not completed yet";
      }
      let timeZoneMultiple = -6;
      if (sessiondoc && typeof sessiondoc.meetingTimeZone !== "undefined") {
        timeZoneMultiple = sessiondoc.meetingTimeZone;
      }
      const finalDate = moment(rawDate, "YYYY-MM-DD HH:mm A").add(parseFloat(timeZoneMultiple) * 60, "minutes");
      const timezoneString = this.getTimeZone(timeZoneMultiple);
      return `${finalDate.format("MMMM, Do YYYY")} at ${finalDate
        .format("hh:mmA")} ${timezoneString}`;
    },
    formatDateWithUTC(rawDate, sessiondoc) {
      if (!rawDate) {
        return "Notarization not completed yet";
      }
      let timeZoneMultiple = -6;
      if (sessiondoc && typeof sessiondoc.meetingTimeZone !== "undefined") {
        timeZoneMultiple = parseFloat(sessiondoc.meetingTimeZone);
      }
      const finalDate = moment.utc(rawDate).utcOffset(timeZoneMultiple);
      const timezoneString = this.getTimeZone(String(timeZoneMultiple));
      return `${finalDate.format("MMMM, Do YYYY")} at ${finalDate
        .format("hh:mmA")} ${timezoneString}`;
    },
    formatDateForMeetingtime(rawDate, sessiondoc) {
      let actualTimezone = "CST";
      if (sessiondoc && sessiondoc.meetingTimeZone) {
        actualTimezone = this.getTimeZone(sessiondoc.meetingTimeZone);
      }
      return `${moment(rawDate, "YYYY-MM-DD HH:mm A").format("MM/DD/YYYY hh:mmA")} ${actualTimezone}`;
    },
  },
};
