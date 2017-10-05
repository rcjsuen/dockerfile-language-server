/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as child_process from "child_process";
import * as assert from "assert";

import { TextDocumentSyncKind } from 'vscode-languageserver';

// fork the server and connect to it using Node IPC
let lspProcess = child_process.fork("out/src/server.js", [ "--node-ipc" ]);

function send(id: number, method: string, params: any) {
	let message = {
		jsonrpc: "2.0",
		id: id,
		method: method,
		params: params
	};
	lspProcess.send(message);
}

function initialize(id: number) {
	send(id, "initialize", {
		rootPath: process.cwd(),
		processId: process.pid,
		capabilities: {
			textDocument: {
				completion: {
					completionItem: {
						snippetSupport: true
					}
				}
			},
			workspace: {
			}
		}
	});
}

describe("Dockerfile LSP Tests", function() {
	it("Initialize", function(finished) {
		this.timeout(5000);
		lspProcess.on('message', function (json) {
			assert.equal(json.id, 1);
			let capabilities = json.result.capabilities;
			assert.equal(capabilities.textDocumentSync, TextDocumentSyncKind.Incremental);
			assert.equal(capabilities.codeActionProvider, true);
			assert.equal(capabilities.completionProvider.resolveProvider, true);
			assert.equal(capabilities.hoverProvider, true);
			finished();
		});
		initialize(1);
	});
});
