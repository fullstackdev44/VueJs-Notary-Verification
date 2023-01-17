import Vue from "vue";
import VueRouter from "vue-router";
import { $axios } from "boot/axios";
// import store from "@/store";
import routes from "./routes";

Vue.use(VueRouter);

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default function (/* { store, ssrContext } */) {
  const Router = new VueRouter({
    scrollBehavior: () => ({ x: 0, y: 0 }),
    routes,

    // Leave these as they are and change in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    mode: process.env.VUE_ROUTER_MODE,
    base: process.env.VUE_ROUTER_BASE,
  });

  Router.beforeEach(async (to, from, next) => {
    if (localStorage.getItem("auth_token_default") !== null) {
      // validate session, before accessing
      if (to.meta.checkInvalidSession && to.meta.checkInvalidSession === true && to.params.id) {
        const url = `session/isValidSession/${to.params.id}/`;
          const response = await $axios.get(url, {
            headers: {
              "Content-Type": "application/json",
            },
          });
        if (response && response.data.status === true) {
          // session is valid
          window.sessionDataDoc = response.data.session;
          next();
        } else {
          window.sessionDataDoc = {};
          // session is invalid, redirect to business
          next("/business");
        }
      } else if (localStorage.getItem("userRole") !== null) {
        // check if user can access the page, based on role
          const role = localStorage.getItem("userRole");
          console.log("role", role);
          const bnUser = localStorage.getItem("bnUser");
          let userDoc = {};
          try {
            userDoc = JSON.parse(bnUser);
          } catch (error) {}
          // Role matched
          if (to.meta.permissions && (to.meta.permissions.includes(role))) {
            // if notary is not approved, check if can access the page
            if (role === "notary" && to.meta.checkIfApproved && to.meta.checkIfApproved === true) {
              // approved notary
              if (userDoc.approve !== "inactive") {
                next();
              } else {
                // not approved notary
                next("/notary/dashboard");
              }
              // all good
            } else {
              next();
            }
            // user cannot access the page, send user to own page
          } else if (role === "notary") {
            next("/notary/dashboard");
          } else if (role === "customer") {
            if (userDoc.landingView) {
              next(userDoc.landingView);
            } else {
              next("/business");
            }
          } else if (role === "admin") {
            next("/customers");
          } else if (role === "witness") {
            next("/witness");
          } else {
            // no role matched
            next("/");
          }
      }
    } else {
      next();
    }
  });

  return Router;
}
