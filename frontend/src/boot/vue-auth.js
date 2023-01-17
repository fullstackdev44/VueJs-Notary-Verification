import auth from "@websanova/vue-auth/src/v2.js";
import driverHttpAxios from "@websanova/vue-auth/src/drivers/http/axios.1.x.js";
import driverRouterVueRouter from "@websanova/vue-auth/src/drivers/router/vue-router.2.x.js";
import { $axios } from "./axios";

export default async ({ Vue, router }) => {
  Vue.use(auth, {
    plugins: {
      http: $axios, // Axios
      router
    },
    drivers: {
      auth: {
        request (req, token) {
          this.drivers.http.setHeaders.call(this, req, {
            Authorization: `Bearer ${token}`
          });
        },
        // eslint-disable-next-line consistent-return
        response (res) {
          if (res?.data?.token) return res?.data?.token;
        }
      },
      http: driverHttpAxios, // Axios
      router: driverRouterVueRouter
    },
    options: {
      rolesKey: "type",
      notFoundRedirect: { path: "/auth/" },
      authRedirect: { path: "/sign-in" },
      registerData: {
        url: "auth/register",
        method: "POST",
        redirect: "/sign-in",
        autoLogin: false
      },
      // loginData: {
      //   url: "auth/login",
      //   method: "POST",
      //   redirect: "/auth",
      //   staySignedIn: true,
      //   fetchUser: true
      // },
      logoutData: {
        url: "auth/sign-out",
        method: "POST",
        redirect: "/sign-in",
        makeRequest: false
      },
      fetchData: {
        url: "users/me",
        method: "GET",
        enabled: false
      },
      refreshData: {
        url: "auth/refresh",
        method: "GET",
        enabled: false,
        interval: 30
      }
    }
  });
};
