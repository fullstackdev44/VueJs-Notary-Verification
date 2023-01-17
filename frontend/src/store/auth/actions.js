import Vue from "vue";

export async function fetchUser ({ commit }) {
  try {
    console.log("Before ME REQ =================");
    const { data } = await Vue.axios.get("/users/me");
    commit("setUser", data.user ?? {});
    commit("setVendorDoc", data.vendorDoc ?? {});
    commit("setOnBoarding", data.onBoarding ?? false);
    commit("setRole", data.user.role ?? "guest");
    console.log("AFTER USER --------------- ", data.user.role);
    localStorage.setItem("userRole", data.user.role ?? "guest");
    localStorage.setItem("bnUser", JSON.stringify(data.user ?? {}));
  } catch (error) {
    console.log(error);
    commit("setUser", {});
    commit("setVendorDoc", {});
    commit("setOnBoarding", false);
    commit("setRole", "guest");
  }
}

export async function setVerifyEmailStatus ({ commit }, status) {
  try {
    commit("setVerifyEmailStatus", status);
  } catch (error) {
    commit("setVerifyEmailStatus", false);
  }
}
