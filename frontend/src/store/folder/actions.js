import Vue from "vue";

const getFoldersList = (folderTree = []) => {
  const res = folderTree
    .reduce((ret, folder) => [...ret, folder, ...getFoldersList(folder.children)], []) ?? [];

  return res;
};
export async function fetchFolders(context) {
  const { commit } = context;
  try {
    const { data: folders } = await Vue.axios.get("/folders/tree");
    commit("setFolders", folders);
    commit("setFoldersList", getFoldersList(folders));
  } catch (error) {
    commit("setFolders", {});
  }
}
