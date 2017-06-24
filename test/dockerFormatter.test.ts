/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as child_process from "child_process";
import * as assert from "assert";

import {
	TextEdit, TextDocument,
	InitializeResult, TextDocumentPositionParams, TextDocumentSyncKind,
	CompletionItem, CompletionItemKind, InsertTextFormat, Hover,
	CodeActionParams, Command, Position, Range, FormattingOptions
} from 'vscode-languageserver';
import { DockerFormatter } from '../src/dockerFormatter';

let formatter = new DockerFormatter();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function formatDocument(document: TextDocument, options?: FormattingOptions): TextEdit[] {
	if (!options) {
		options = {
			insertSpaces: false,
			tabSize: 4
		};
	}
	return formatter.formatDocument(document, options);
}

function formatRange(document: TextDocument, range: Range, options?: FormattingOptions): TextEdit[] {
	if (!options) {
		options = {
			insertSpaces: false,
			tabSize: 4
		};
	}
	return formatter.formatRange(document, range, options);
}

describe("Dockerfile formatter", function() {
	describe("document", function() {
		describe("whitespace", function() {
			it("empty file", function() {
				let document = createDocument("");
				let edits = formatDocument(document);
				assert.equal(edits.length, 0);
			});

			it("spaces", function() {
				let document = createDocument("    ");
				let edits = formatDocument(document);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 4);
			});

			it("tabs", function() {
				let document = createDocument("\t\t\t\t");
				let edits = formatDocument(document);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 4);
			});

			it("tabs and spaces", function() {
				let document = createDocument("\t   \t \t\t  ");
				let edits = formatDocument(document);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, document.getText().length);
			});

			it("\\n preserved", function() {
				let document = createDocument("\n\n");
				let edits = formatDocument(document);
				assert.equal(edits.length, 0);
			});

			it("\\r\\n preserved", function() {
				let document = createDocument("\r\n\r\n");
				let edits = formatDocument(document);
				assert.equal(edits.length, 0);
			});
		});

		describe("comments", function() {
			it("leading whitespace", function() {
				let document = createDocument(" # comment");
				let edits = formatDocument(document);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 1);
			});
		});

		describe("instructions", function() {
			it("leading whitespace", function() {
				let document = createDocument("   FROM node");
				let edits = formatDocument(document);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 3);
			});

			it("end of file whitespace", function() {
				let document = createDocument("   FROM node\n  ");
				let edits = formatDocument(document);
				assert.equal(edits.length, 2);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 3);
				assert.equal(edits[1].newText, "");
				assert.equal(edits[1].range.start.line, 1);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 1);
				assert.equal(edits[1].range.end.character, 2);
			});
		});

		describe("newline escaped tabbing", function() {
			it("single newline", function() {
				let document = createDocument("EXPOSE 8081\\\n8082");
				let edits = formatDocument(document);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);

				document = createDocument("EXPOSE 8081\\\r\n8082");
				edits = formatDocument(document);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);
			});

			it("single newline with `", function() {
				let document = createDocument("#escape=`\nEXPOSE 8081`\n8082");
				let edits = formatDocument(document);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 2);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 2);
				assert.equal(edits[0].range.end.character, 0);

				document = createDocument("#escape=`\r\nEXPOSE 8081`\r\n8082");
				edits = formatDocument(document);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 2);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 2);
				assert.equal(edits[0].range.end.character, 0);
			});

			it("extra tabs", function() {
				let document = createDocument("EXPOSE 8081\\\n\t\t8082");
				let edits = formatDocument(document);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 2);

				document = createDocument("EXPOSE 8081\\\r\n\t\t8082");
				edits = formatDocument(document);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 2);
			});
		});
	});

	describe("range", function() {
		describe("single line selection", function() {
			it("empty", function() {
				let document = createDocument("");
				let range = Range.create(Position.create(0, 0), Position.create(0, 0));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 0);
			});

			it("whitespace", function() {
				let document = createDocument("  \t");
				let range = Range.create(Position.create(0, 1), Position.create(0, 2));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 3);
			});

			it("instruction", function() {
				let document = createDocument("  FROM node");
				let range = Range.create(Position.create(0, 1), Position.create(0, 2));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 2);
			});

			it("comment", function() {
				let document = createDocument("  # comment");
				let range = Range.create(Position.create(0, 1), Position.create(0, 2));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 2);
			});

			it("nested", function() {
				let document = createDocument("FROM node\n\tEXPOSE 8080\nHEALTHCHECK NONE");
				let range = Range.create(Position.create(1, 3), Position.create(1, 4));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 1);

				// select an irrelevant line
				range = Range.create(Position.create(2, 3), Position.create(2, 4));
				edits = formatRange(document, range);
				assert.equal(edits.length, 0);
			});
		});
	});
});
