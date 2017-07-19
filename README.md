# Dockerfile language server

[![Build Status](https://travis-ci.org/rcjsuen/dockerfile-language-server-nodejs.svg?branch=master)](https://travis-ci.org/rcjsuen/dockerfile-language-server-nodejs) [![Coverage Status](https://coveralls.io/repos/github/rcjsuen/dockerfile-language-server-nodejs/badge.svg?branch=master)](https://coveralls.io/github/rcjsuen/dockerfile-language-server-nodejs?branch=master) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is a language server for Dockerfiles powered by Node.js
written in TypeScript.

Supported features:
- code actions
- code completion
- definition
- diagnostics
- document highlight
- document symbols
- formatting
- hovers
- rename

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

Once the code has finished compiling, you can connect a language server
client to the server via Node IPC, stdio, or sockets.

### Settings

Clients may send a `workspace/didChangeConfiguration` notification to
notify the server of settings changes.

The settings object that will be included with the notification must conform
to the following specification.

```TypeScript
interface Settings {
  docker: {
    languageserver: {
      diagnostics?: {
        // string values must be equal to "ignore", "warning", or "error"
        deprecatedMaintainer?: string,
        directiveCasing?: string,
        instructionCasing?: string,
        instructionCmdMultiple?: string,
        instructionHealthcheckMultiple?: string
      }
    }
  }
}
```

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

### Standard Input/Output

When writing directly to the process's stdin, the additional `Content-Length`
header must be included. Similarly, when reading from the process's stdout, the
header will be included in the response message.

```TypeScript
import * as child_process from "child_process";

let lspProcess = child_process.spawn("node", [ "out/src/server.js", "--stdio" ]);
let messageId = 1;

function send(method: string, params: object) {
    let message = {
        jsonrpc: "2.0",
        id: messageId++,
        method: method,
        params: params
    };
    let json = JSON.stringify(message);
    let headers = "Content-Length: " + json.length + "\r\n\r\n";
    lspProcess.stdin.write(headers, "ASCII");
    lspProcess.stdin.write(json, "UTF-8");
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

lspProcess.stdout.on("data", (message) => {
    // "Content-Length: ...\r\n\r\n\" will be included here
    console.log(message.toString());
});

initialize();
```

#### vscode-jsonrpc

The `StreamMessageReader` and `StreamMessageWriter` classes from the
`vscode-jsonrpc` module will handle the `Content-Length` headers for you so you
only have to worry about the actual request and response.

```TypeScript
import * as child_process from "child_process";
import { StreamMessageReader, StreamMessageWriter } from "vscode-jsonrpc";

let lspProcess = child_process.spawn("node", [ "out/src/server.js", "--stdio" ]);
let messageId = 1;

const reader = new StreamMessageReader(lspProcess.stdout);
const writer = new StreamMessageWriter(lspProcess.stdin);

function send(method: string, params: object) {
    let message = {
        jsonrpc: "2.0",
        id: messageId++,
        method: method,
        params: params
    };
    writer.write(message);
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

reader.listen((data) => {
    console.log(data);
})

initialize();
```
