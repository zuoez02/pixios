const electron = window.require("electron");
const { remote } = electron;
const EStore = remote.require("electron-store");

const schema = {
  folders: {
    type: "array",
    default: []
  },
  mode: {
    type: "string",
    enum: ["single", "recent", "folders"],
    default: "single"
  },
  picMode: {
    type: "string",
    enum: ["picture", "manga"],
    default: "picture"
  },
  size: {
    type: "string",
    enum: ["100", "300", "500", "700"],
    default: "300"
  },
  sort: {
    type: "string",
    enum: ["timeAsc", "timeDesc", "nameAsc", "nameDesc"],
    default: "nameDesc"
  },
  folder: {
    type: "string",
    default: ""
  },
  days: {
    type: "number",
    default: 0
  }
};

const store = new EStore({ schema });

export default store;
