/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as child_process from "child_process";
import * as assert from "assert";

import { TextDocumentSyncKind } from 'vscode-languageserver';
import { CommandIds } from '../src/dockerCommands';
import { ValidationCode } from '../src/dockerValidator';

// fork the server and connect to it using Node IPC
let lspProcess = child_process.fork("out/src/server.js", [ "--node-ipc" ]);
let messageId = 1;

function sendRequest(method: string, params: any): number {
	let message = {
		jsonrpc: "2.0",
		id: messageId++,
		method: method,
		params: params
	};
	lspProcess.send(message);
	return messageId - 1;
}

function sendNotification(method: string, params: any) {
	let message = {
		jsonrpc: "2.0",
		method: method,
		params: params
	};
	lspProcess.send(message);
}

function initialize(): number {
	return sendRequest("initialize", {
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
	it("initialize", function(finished) {
		this.timeout(5000);
		const responseId = initialize();
		lspProcess.once('message', function (json) {
			assert.equal(json.id, responseId);
			let capabilities = json.result.capabilities;
			assert.equal(capabilities.textDocumentSync, TextDocumentSyncKind.Incremental);
			assert.equal(capabilities.codeActionProvider, false);
			assert.equal(capabilities.completionProvider.resolveProvider, true);
			assert.equal(capabilities.executeCommandProvider, undefined);
			assert.equal(capabilities.hoverProvider, true);
			finished();
		});
	});

	it("initialized", function() {
		sendNotification("initialized", {});
	});

	it("issue #183", function(finished) {
		this.timeout(5000);
		sendNotification("textDocument/didOpen", {
			textDocument: {
				languageId: "dockerfile",
				version: 1,
				uri: "uri://dockerfile/x.txt",
				text: "from node"
			}
		});

		const codeActionResponseId = sendRequest("textDocument/codeAction", {
			textDocument: {
				uri: "uri://dockerfile/x.txt"
			},
			context: {
				diagnostics: [
					{
						code: ValidationCode.CASING_INSTRUCTION
					}
				]
			}
		});
		const codeActionListener = function (json) {
			if (json.id === codeActionResponseId) {
				assert.ok(Array.isArray(json.result));
				assert.equal(json.result.length, 0);
				lspProcess.removeListener("message", codeActionListener);
			}
		};
		lspProcess.on("message", codeActionListener);

		const executeCommandResponseId = sendRequest("workspace/executeCommand", {
			command: CommandIds.UPPERCASE,
			arguments: [
				"uri://dockerfile/x.txt",
				{
					start: {
						line: 0,
						character: 0
					},
					end: {
						line: 0,
						character: 4
					}
				}
			]
		});
		const executeCommandListener = function (json) {
			if (json.method === "workspace/applyEdit") {
				throw new Error("workspace/applyEdit method received");
			} else if (json.id === executeCommandResponseId) {
				lspProcess.removeListener("message", executeCommandListener);
				finished();
			}
		};
		lspProcess.on("message", executeCommandListener);
	});
});
