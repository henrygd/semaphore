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
export {
  getSemaphore
};
