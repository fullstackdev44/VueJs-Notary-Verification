export function user(state) {
  return state.user;
}
export function vendorDoc(state) {
  return state.vendorDoc;
}

export function role(state) {
  return state.role;
}

export function onBoarding(state) {
  return state.onBoarding;
}
export function authenticated(state) {
  return !!state.user?.id;
}

export function resendVerifyEmail(state) {
  return state.verifyEmail;
}

export function type(state) {
  return state.user?.type ?? "guest";
}
