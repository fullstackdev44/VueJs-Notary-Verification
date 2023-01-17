export function customers(state) {
  return state.customers;
}

export function tokenUser(state) {
  return state.tokenUser;
}

export function labelers(state) {
  return state?.users?.filter(({ type }) => type === "labeler") ?? [];
}

export function users(state) {
  return state.users;
}
