var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var semaphore_exports = {};
__export(semaphore_exports, {
  getSemaphore: () => getSemaphore
});
module.exports = __toCommonJS(semaphore_exports);
let semaphoreMap = /* @__PURE__ */ new Map();
let getSemaphore = (key = Symbol(), concurrency = 1) => {
  if (semaphoreMap.has(key)) {
    return semaphoreMap.get(key);
  }
  let size = 0;
  let head;
  let tail;
  let createPromise = (res) => {
    if (head) {
      tail = tail.b = { a: res };
    } else {
      tail = head = { a: res };
    }
  };
  let semaphore = {
    acquire: () => {
      if (++size <= concurrency) {
        return Promise.resolve();
      }
      return new Promise(createPromise);
    },
    release() {
      head?.a();
      head = head?.b;
      if (size && !--size) {
        semaphoreMap.delete(key);
      }
    },
    size: () => size
  };
  semaphoreMap.set(key, semaphore);
  return semaphore;
};
