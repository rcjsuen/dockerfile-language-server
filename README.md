# Dockerfile language server

[![Build Status](https://travis-ci.org/rcjsuen/dockerfile-language-server-nodejs.svg?branch=master)](https://travis-ci.org/rcjsuen/dockerfile-language-server-nodejs) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is a language server for Dockerfiles powered by Node.js
written in TypeScript.

Supported features:
- code actions
- code completion
- diagnostics
- document symbols
- formatting
- hovers

## Setup Instructions

To build and compile this language server, you should first [install
Node.js](https://nodejs.org/en/download/) if you haven't already done so.

```
npm install
npm run build
npm test
```

If you are planning to change the code, use `npm run watch` to get the
TypeScript files transpiled on-the-fly as they are modified.

Once the code has finished compiling, you can connect to it using stdio,
sockets, or Node IPC.

### Node IPC

With the `child_process` API, you can `fork()` a new Node.js process
running the language server and communicate with it using `send(message)`
and `on('message', ...)`.

```TypeScript
import * as child_process from "child_process";

let lspProcess = child_process.fork("out/src/server.js", [ "--node-ipc" ]);
let messageId = 1;

function send(method: string, params: object) {
    let message = {
        jsonrpc: "2.0",
        id: messageId++,
        method: method,
        params: params
    };
    lspProcess.send(message);
}

function initialize() {
    send("initialize", {
        rootPath: process.cwd(),
        processId: process.pid,
        capabilities: {
            /* ... */
        }
    });
}


lspProcess.on('message', function (json) {
    console.log(json);
});
initialize();
```
