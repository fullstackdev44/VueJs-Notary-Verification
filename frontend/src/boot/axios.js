/* eslint-disable no-underscore-dangle */
import axios from "axios";
import { Notify } from "quasar";
import VueAxios from "vue-axios";
// import Store from "../store/index";

const errorHandler = async (error, redirect, Vue) => {
  const code = parseInt(error.response && error.response.status, 10);
  if (Number.isNaN(code)) {
    throw error;
  }
  if (code === 401) {
    Vue.auth.logout();
    window.sessionStorage.clear();
  } else if (code === 403) {
    Notify.create({
      type: "negative",
      color: "negative",
      timeout: 3000,
      position: "top-right",
      message: "You don't have permission access this page.",
    });
    redirect("/notary/dashboard");
  } else if (code === 422) {
    Notify.create({
      type: "negative",
      color: "negative",
      timeout: 3000,
      position: "top-right",
      message:
        Object.values(error?.response?.data?.errors ?? {})?.[0] ??
        "The given data was invalid.",
    });
  } else {
    console.log(error.response);
    const errorMessage =
      error?.response?.data?.errors?.msg ?? "Something went wrong.";
    if (errorMessage) {
      if (errorMessage === "EMAIL_ALREADY_EXISTS") {
        Notify.create({
          type: "negative",
          color: "negative",
          timeout: 3000,
          position: "bottom-right",
          message: "Email already exists. Please try a different email address.",
        });
      } else if (errorMessage === "UNAUTHORIZED") {
        // Notify.create({
        //   type: "negative",
        //   color: "negative",
        //   timeout: 3000,
        //   position: "bottom-right",
        //   message: "Same email exits and use a different email address",
        // });
      } else {
        Notify.create({
          type: "negative",
          color: "negative",
          timeout: 3000,
          position: "bottom-right",
          message: errorMessage || "Something went wrong.",
        });
      }
    }
    throw error;
  }
};
const responseHandler = async (response) => {
  if (response?.data?.message) {
    if (response.data.resendVerifyEmail) {
      console.log(response.data.message);
      localStorage.setItem("resendVerifyEmail", true);
    }
    console.log(response.data);
    Notify.create({
      type: "positive",
      timeout: 2000,
      position: "top-right",
      message: response?.data?.message,
    });
  }
  return response;
};

const $axios = axios.create({ baseURL: process.env.API_BASE_URL });
const uploadApi = axios.create({ baseURL: process.env.API_BASE_URL });

// const $axios = axios.create({ baseURL: "http://localhost:5000/api" });
// const uploadApi = axios.create({ baseURL: "http://localhost:5000/api" });

export default async (context) => {
  const { redirect, Vue } = context;
  $axios.interceptors.response.use(
    responseHandler,
    (error) => errorHandler(error, redirect, Vue, context),
  );
  $axios.CancelToken = axios.CancelToken;
  Vue.prototype.$axios = $axios;
  Vue.use(VueAxios, $axios);
};

export { $axios, uploadApi };
