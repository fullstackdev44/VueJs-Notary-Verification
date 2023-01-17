// import something here

// "async" is optional;
// more info on params: https://quasar.dev/quasar-cli/boot-files
export default async ({
  store,
}) => {
  await store.dispatch("auth/fetchUser");
};
