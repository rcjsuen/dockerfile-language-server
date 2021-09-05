# Dockerfile Language Server

![Node.js Builds](https://github.com/rcjsuen/dockerfile-language-server-nodejs/workflows/Node.js%20Builds/badge.svg?branch=master) [![Coverage Status](https://coveralls.io/repos/github/rcjsuen/dockerfile-language-server-nodejs/badge.svg?branch=master)](https://coveralls.io/github/rcjsuen/dockerfile-language-server-nodejs?branch=master) [![Build Dependencies](https://david-dm.org/rcjsuen/dockerfile-language-server-nodejs.svg)](https://david-dm.org/rcjsuen/dockerfile-language-server-nodejs) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is a language server for Dockerfiles powered by Node.js written in TypeScript.
To [install and run](#installation-instructions) this language server, you will need to have either [Node.js](https://nodejs.org/en/download/) or [Docker](https://www.docker.com/get-docker) installed on your computer.

**Supported features:**
- code actions
- code completion
- definition
- diagnostics
- document highlight
- document links
- document symbols
- folding ranges
- formatting
- hovers
- prepare rename
- rename
- semantic highlighting (experimental support for the upcoming LSP 3.16 specification)
- signature help

**Projects that use this language server:**
- [vscode-docker](https://github.com/Microsoft/vscode-docker)
- [atom-ide-docker](https://github.com/josa42/atom-ide-docker)
- [Sourcegraph](https://sourcegraph.com/)
- [Theia](https://theia-ide.org/)
- [lsp-mode](https://emacs-lsp.github.io/lsp-mode/)

This repository only contains the code necessary for launching a Dockerfile language server that conforms to the language server protocol.
The actual code for parsing a Dockerfile and offering editor features such as code completion or hovers is not contained within this repository.

The code for analyzing and processing a Dockerfile is contained in the following three libraries:
- [dockerfile-ast](https://github.com/rcjsuen/dockerfile-ast) - parses a Dockerfile
- [dockerfile-language-service](https://github.com/rcjsuen/dockerfile-language-service) - provides API functions for handling the different requests defined by the language server protocol
- [dockerfile-utils](https://github.com/rcjsuen/dockerfile-utils) - validates and formats a Dockerfile, can be run from the CLI

All of the language server protocol requests that help create a rich editing experience for the user is forwarded to the `dockerfile-language-service` library.
You can test its features [right in the browser](https://rcjsuen.github.io/dockerfile-language-service/).
This online editor is a very good representation of what is possible when this language server is connected to an editor that supports the language server protocol.

## Development Instructions

If you wish to build and compile this language server, you must first install [Node.js](https://nodejs.org/en/download/) if you have not already done so.
After you have installed Node.js and cloned the repository with Git, you may now proceed to build and compile the language server with the following commands:

```
npm install
npm run build
npm test
```

If you are planning to change the code, use `npm run watch` to get the
TypeScript files transpiled on-the-fly as they are modified.

Once the code has finished compiling, you can connect a language server
client to the server via Node IPC, stdio, or sockets.

## Installation Instructions

To install this language server onto your computer, please install the
[dockerfile-language-server-nodejs npm module](https://www.npmjs.com/package/dockerfile-language-server-nodejs).
The `-g` flag will install the npm module globally onto your computer.

```
npm install -g dockerfile-language-server-nodejs
```

After the installation has completed, you can start the language
server with the `docker-langserver` binary. You should specify
the desired method of communicating with the language server via one
of the three arguments shown below.

```
docker-langserver --node-ipc
docker-langserver --stdio
docker-langserver --socket=<port>
```

### Docker Image
The `docker-langserver` binary is also available as a Docker image under the name `rcjsuen/docker-langserver`.

## Language Server Settings

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
        emptyContinuationLine?: string,
        instructionCasing?: string,
        instructionCmdMultiple?: string,
        instructionEntrypointMultiple?: string,
        instructionHealthcheckMultiple?: string,
        instructionJSONInSingleQuotes?: string
      },
      formatter?: {
        ignoreMultilineInstructions?: boolean,
      }
    }
  }
}
```

## Communicating with the Server
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

### Sockets

To communicate with the langauge server via a socket, a port must be opened
up first to listen for incoming connections. After the port is opened, the
language server may be started and told to connect to the specified port.
Messages can then be read from and written to the socket.

Just like when trying to communicate to the server using
[stdio](#standard-inputoutput), the `Content-Length` headers must be written
and parsed explicitly.

```TypeScript
import * as net from "net"
import * as child_process from "child_process"

let messageId = 1;

function send(socket: net.Socket, method: string, params: object) {
    let message = {
        jsonrpc: "2.0",
        id: messageId++,
        method: method,
        params: params
    };
    let json = JSON.stringify(message) + "\n";
    let headers = "Content-Length: " + json.length + "\r\n\r\n";
    socket.write(headers, "ASCII");
    socket.write(json, "UTF-8");
}

function initialize(socket: net.Socket) {
    send(socket, "initialize", {
        rootPath: process.cwd(),
        processId: process.pid,
        capabilities: {
            textDocument: {
                /* ... */
            },
            workspace: {
                /* ... */
            }
        }
    });
}

const server = net.createServer((socket: net.Socket) => {
    server.close();
    socket.on("data", (message) => {
        // "Content-Length: ...\r\n\r\n\" will be included here
        console.log(message.toString());
    });
    initialize(socket);
});

server.listen(3000, () => {
    child_process.spawn("node", [ "out/src/server.js", "--socket=3000" ]);
});
```

#### vscode-jsonrpc

The `SocketMessageReader` and `SocketMessageWriter` classes from the
`vscode-jsonrpc` module will handle the `Content-Length` headers for you so you
only have to worry about the actual request and response.

```TypeScript
import * as net from "net"
import * as child_process from "child_process"
import { SocketMessageReader, SocketMessageWriter } from "vscode-jsonrpc";

let messageId = 1;
let reader: SocketMessageReader = null;
let writer: SocketMessageWriter = null;

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
            textDocument: {
                /* ... */
            },
            workspace: {
                /* ... */
            }
        }
    });
}

const server = net.createServer((socket: net.Socket) => {
    server.close();
    reader = new SocketMessageReader(socket);
    reader.listen((data) => {
        console.log(data);
    });
    writer = new SocketMessageWriter(socket);
    initialize();
});

server.listen(3000, () => {
    child_process.spawn("node", [ "out/src/server.js", "--socket=3000" ]);
});
```
