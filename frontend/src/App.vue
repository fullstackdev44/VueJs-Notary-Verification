<template>
  <div id="q-app">
    <router-view />
  </div>
</template>
<script>
import socketIOClient from "socket.io-client";
// import { $axios } from "boot/axios";
import VueEventBus from "./plugins/eventbus";

export default {
  name: "App",
  mounted() {
    let socketURL = "/";
    if (window.location && window.location.host === "localhost:8080") {
      socketURL = "localhost:3001";
    }
    const socket = socketIOClient.connect(socketURL, {
      query: {},
      path: "/default_socket/",
      transports: ["websocket"],
      reconnectionDelay: 30000,
      reconnectionDelayMax: 40000,
      reconnectionAttempts: 20
    });
    console.log(socket);
    window.currentSocket = socket;
    window.socketURL = socketURL;
    socket.on("connect", () => {
      console.log(socket.connected); // true
    });

    socket.on("disconnect", () => {
      console.log(socket.connected); // false
    });
    socket.on("connect", (connectedSocket) => {
      console.log("connected");
      console.log(connectedSocket);
      VueEventBus.$emit("SOCKET_RECONNECTED");
      socket.on("updates", (resp) => {
        VueEventBus.$emit("SOCKET_UPDATES", resp);
      });
      console.log(this.$user);
      // console.log("App.vue 41", this.$user);
      socket.emit("initialize", { user: this.$user._id }, (res) => {
        console.log(res);
      });
      if (window.connectionInterval) {
        clearInterval(window.connectionInterval);
      }
      socket.emit("connection_active", {
        event: "connection_active",
        user: this.$user._id,
        userrole: this.$user.role,
        memberType: this.$user.memberType,
        url: window.location.href.replace(/(.+\w\/)(.+)/, "/$2")
      }, (res) => {
        console.log(res);
      });
      window.connectionInterval = setInterval(() => {
        socket.emit("connection_active", {
          event: "connection_active",
          user: this.$user._id,
          userrole: this.$user.role,
          memberType: this.$user.memberType,
          url: window.location.href.replace(/(.+\w\/)(.+)/, "/$2")
        }, (res) => {
          console.log(res);
        });
      }, 120000);
    });
    window.addEventListener("beforeunload", () => {
      if (window.currentSessionId) {
        console.log("unload called", window.currentSessionId);
        const dataToSend = {
          sessionid: window.currentSessionId,
          user: this.$user._id
        };
        socket.emit("leave_session", dataToSend, (res) => {
          console.log("res", res);
        });
      }
      // const pageReloaded = window.performance
      //            .getEntriesByType("navigation")
      //            .map((nav) => nav.type)
      //            .includes("reload");
      // console.log("pageReloaded", pageReloaded);
      // console.log(window.performance
      //            .getEntriesByType("navigation")
      //            .map((nav) => nav.type));
      // if (!pageReloaded) { // The pageReloaded boolean we set earlier
      //   if (window.location.href.includes("kba")) {
      //     const urlMatch = window.location.href.match(/kba\/([0-9a-z]+)/);
      //     let currentSessionId;
      //     console.log("urlMatch", urlMatch);
      //     if (urlMatch && urlMatch[0]) {
      //       currentSessionId = urlMatch[0];
      //     }
      //     const url = `session/setSessionStageOrStatus/${currentSessionId}/?type=stage&value=kba_check_stage_aborted`;
      //     $axios.get(url, {
      //       headers: {
      //         "Content-Type": "application/json",
      //       },
      //     });
      //     console.log();
      //   }
      //   if (window.location.href.includes("photoid")) {
      //     const urlMatch = window.location.href.match(/photoid\/([0-9a-z]+)/);
      //     let currentSessionId;
      //     console.log("urlMatch", urlMatch);
      //     if (urlMatch && urlMatch[0]) {
      //       currentSessionId = urlMatch[0];
      //     }
      //     const url = `session/setSessionStageOrStatus/${currentSessionId}/?type=stage&value=photoid_check_stage_aborted`;
      //     $axios.get(url, {
      //       headers: {
      //         "Content-Type": "application/json",
      //       },
      //     });
      //     console.log();
      //   }
      //   if (window.location.href.includes("payment_info")) {
      //     const urlMatch = window.location.href.match(/payment_info\/([0-9a-z]+)/);
      //     let currentSessionId;
      //     console.log("urlMatch", urlMatch);
      //     if (urlMatch && urlMatch[0]) {
      //       currentSessionId = urlMatch[0];
      //     }
      //     const url = `session/setSessionStageOrStatus/${currentSessionId}/?type=stage&value=payment_info_check_stage_aborted`;
      //     $axios.get(url, {
      //       headers: {
      //         "Content-Type": "application/json",
      //       },
      //     });
      //     console.log();
      //   }
      // }
    });
    window.allTimeZones = [
      { label: "(GMT-12:00) International Date Line West", value: "-12" },
      { label: "(GMT-11:00) Midway Island, Samoa", value: "-11" },
      { label: "(GMT-10:00) Hawaii", value: "-10" },
      { label: "(GMT-09:00) Alaska", value: "-9" },
      { label: "(GMT-08:00) Pacific", value: "-8" },
      { label: "(GMT-08:00) Tijuana, Baja California", value: "-8" },
      { label: "(GMT-07:00) Arizona", value: "-7" },
      { label: "(GMT-07:00) Chihuahua, La Paz, Mazatlan", value: "-7" },
      { label: "(GMT-07:00) Mountain", value: "-7" },
      { label: "(GMT-06:00) Central America", value: "-6" },
      { label: "(GMT-06:00) Central", value: "-6" },
      { label: "(GMT-05:00) Bogota, Lima, Quito, Rio Branco", value: "-5" },
      { label: "(GMT-05:00) Eastern", value: "-5" },
      { label: "(GMT-05:00) Indiana (East)", value: "-5" },
      { label: "(GMT-04:00) Atlantic Time (Canada)", value: "-4" },
      { label: "(GMT-04:00) Caracas, La Paz", value: "-4" },
      { label: "(GMT-04:00) Manaus", value: "-4" },
      { label: "(GMT-04:00) Santiago", value: "-4" },
      { label: "(GMT-03:30) Newfoundland", value: "-3.5" },
      { label: "(GMT-03:00) Brasilia", value: "-3" },
      { label: "(GMT-03:00) Buenos Aires, Georgetown", value: "-3" },
      { label: "(GMT-03:00) Greenland", value: "-3" },
      { label: "(GMT-03:00) Montevideo", value: "-3" },
      { label: "(GMT-02:00) Mid-Atlantic", value: "-2" },
      { label: "(GMT-01:00) Cape Verde Is.", value: "-1" },
      { label: "(GMT-01:00) Azores", value: "-1" },
      { label: "(GMT+00:00) Casablanca, Monrovia, Reykjavik", value: "0" },
      { label: "(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London", value: "0" },
      { label: "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna", value: "1" },
      { label: "(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague", value: "1" },
      { label: "(GMT+01:00) Brussels, Copenhagen, Madrid, Paris", value: "1" },
      { label: "(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb", value: "1" },
      { label: "(GMT+01:00) West Central Africa", value: "1" },
      { label: "(GMT+02:00) Amman", value: "2" },
      { label: "(GMT+02:00) Athens, Bucharest, Istanbul", value: "2" },
      { label: "(GMT+02:00) Beirut", value: "2" },
      { label: "(GMT+02:00) Cairo", value: "2" },
      { label: "(GMT+02:00) Harare, Pretoria", value: "2" },
      { label: "(GMT+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius", value: "2" },
      { label: "(GMT+02:00) Jerusalem", value: "2" },
      { label: "(GMT+02:00) Minsk", value: "2" },
      { label: "(GMT+02:00) Windhoek", value: "2" },
      { label: "(GMT+03:00) Kuwait, Riyadh, Baghdad", value: "3" },
      { label: "(GMT+03:00) Moscow, St. Petersburg, Volgograd", value: "3" },
      { label: "(GMT+03:00) Nairobi", value: "3" },
      { label: "(GMT+03:00) Tbilisi", value: "3" },
      { label: "(GMT+03:30) Tehran", value: "3.5" },
      { label: "(GMT+04:00) Abu Dhabi, Muscat", value: "4" },
      { label: "(GMT+04:00) Baku", value: "4" },
      { label: "(GMT+04:00) Yerevan", value: "4" },
      { label: "(GMT+04:30) Kabul", value: "4.5" },
      { label: "(GMT+05:00) Yekaterinburg", value: "5" },
      { label: "(GMT+05:00) Islamabad, Karachi, Tashkent", value: "5" },
      { label: "(GMT+05:30) Sri Jayawardenapura", value: "5.5" },
      { label: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi", value: "5.5" },
      { label: "(GMT+05:45) Kathmandu", value: "5.75" },
      { label: "(GMT+06:00) Almaty, Novosibirsk", value: "6" }, { label: "(GMT+06:00) Astana, Dhaka", value: "6" },
      { label: "(GMT+06:30) Yangon (Rangoon)", value: "6.5" },
      { label: "(GMT+07:00) Bangkok, Hanoi, Jakarta", value: "7" },
      { label: "(GMT+07:00) Krasnoyarsk", value: "7" },
      { label: "(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi", value: "8" },
      { label: "(GMT+08:00) Kuala Lumpur, Singapore", value: "8" },
      { label: "(GMT+08:00) Irkutsk, Ulaan Bataar", value: "8" },
      { label: "(GMT+08:00) Perth", value: "8" },
      { label: "(GMT+08:00) Taipei", value: "8" },
      { label: "(GMT+09:00) Osaka, Sapporo, Tokyo", value: "9" },
      { label: "(GMT+09:00) Seoul", value: "9" },
      { label: "(GMT+09:00) Yakutsk", value: "9" },
      { label: "(GMT+09:30) Adelaide", value: "9.5" },
      { label: "(GMT+09:30) Darwin", value: "9.5" },
      { label: "(GMT+10:00) Brisbane", value: "10" },
      { label: "(GMT+10:00) Canberra, Melbourne, Sydney", value: "10" },
      { label: "(GMT+10:00) Hobart", value: "10" },
      { label: "(GMT+10:00) Guam, Port Moresby", value: "10" },
      { label: "(GMT+10:00) Vladivostok", value: "10" },
      { label: "(GMT+11:00) Magadan, Solomon Is., New Caledonia", value: "11" },
      { label: "(GMT+12:00) Auckland, Wellington", value: "12" },
      { label: "(GMT+12:00) Fiji, Kamchatka, Marshall Is.", value: "12" },
      { label: "(GMT+13:00) Nuku'alofa", value: "13" }
    ];
  }
};
</script>
<style>
#zmmtg-root {
  display: none;
}
</style>
