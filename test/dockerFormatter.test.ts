/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import {
	TextEdit, TextDocument, Position, Range, FormattingOptions
} from 'vscode-languageserver';
import { DockerFormatter } from '../src/dockerFormatter';

let formatter = new DockerFormatter();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
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

function formatOnType(document: TextDocument, position: Position, ch: string, options?: FormattingOptions): TextEdit[] {
	if (!options) {
		options = {
			insertSpaces: false,
			tabSize: 4
		};
	}
	return formatter.formatOnType(document, position, ch, options);
}

describe("Dockerfile formatter", function() {
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
				let document = createDocument("FROM node");
				let range = Range.create(Position.create(0, 1), Position.create(0, 2));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 0);

				document = createDocument("  FROM node");
				range = Range.create(Position.create(0, 1), Position.create(0, 2));
				edits = formatRange(document, range);
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

			/**
			 * FROM node
			 * EXPOSE 8080\
			 * 8[08]1
			 * ------------
			 * FROM node
			 * EXPOSE 8080\
			 * \t8081
			 */
			it("escape non-whitespace", function() {
				let document = createDocument("FROM node\nEXPOSE 8080\\\n8081");
				let range = Range.create(Position.create(2, 1), Position.create(2, 2));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 2);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 2);
				assert.equal(edits[0].range.end.character, 0);

				document = createDocument("FROM node\rEXPOSE 8080\\\r8081");
				range = Range.create(Position.create(2, 1), Position.create(2, 2));
				edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 2);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 2);
				assert.equal(edits[0].range.end.character, 0);

				document = createDocument("FROM node\r\nEXPOSE 8080\\\r\n8081");
				range = Range.create(Position.create(2, 1), Position.create(2, 2));
				edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 2);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 2);
				assert.equal(edits[0].range.end.character, 0);
			});

			/**
			 * FROM node
			 * EXPOSE 8080\
			 *  8[08]1
			 * ------------
			 * FROM node
			 * EXPOSE 8080\
			 * \t8081
			 */
			it("escape whitespace", function() {
				let document = createDocument("FROM node\nEXPOSE 8080\\\n 8081");
				let range = Range.create(Position.create(2, 2), Position.create(2, 3));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 2);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 2);
				assert.equal(edits[0].range.end.character, 1);

				edits = formatRange(document, range, { tabSize: 2, insertSpaces: true });
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "  ");
				assert.equal(edits[0].range.start.line, 2);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 2);
				assert.equal(edits[0].range.end.character, 1);

				document = createDocument("FROM node\rEXPOSE 8080\\\r 8081");
				range = Range.create(Position.create(2, 1), Position.create(2, 2));
				edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 2);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 2);
				assert.equal(edits[0].range.end.character, 1);

				document = createDocument("FROM node\r\nEXPOSE 8080\\\r\n 8081");
				range = Range.create(Position.create(2, 1), Position.create(2, 2));
				edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 2);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 2);
				assert.equal(edits[0].range.end.character, 1);
			});

			it("no indentation", function() {
				let document = createDocument("FROM node\n\tEXPOSE 8080");
				let range = Range.create(Position.create(1, 3), Position.create(1, 4));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 1);

				document = createDocument("FROM node\r\tEXPOSE 8080");
				range = Range.create(Position.create(1, 3), Position.create(1, 4));
				edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 1);

				document = createDocument("FROM node\r\n\tEXPOSE 8080");
				range = Range.create(Position.create(1, 3), Position.create(1, 4));
				edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 1);
			});

			it("whitespace before escape", function() {
				let document = createDocument("EXPOSE 8081\\ \n8082");
				let range = Range.create(Position.create(1, 3), Position.create(1, 4));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);

				document = createDocument("EXPOSE 8081\\ \r8082");
				range = Range.create(Position.create(1, 3), Position.create(1, 4));
				edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);

				document = createDocument("EXPOSE 8081\\ \r\n8082");
				range = Range.create(Position.create(1, 3), Position.create(1, 4));
				edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);
			});
		});

		describe("multi line selection", function() {

			/**
			 *  [ 
			 *  ] 
			 * ---
			 * 
			 * 
			 */
			it("empty", function() {
				let document = createDocument("  \n  ");
				let range = Range.create(Position.create(0, 1), Position.create(1, 1));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 2);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 2);
				assert.equal(edits[1].newText, "");
				assert.equal(edits[1].range.start.line, 1);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 1);
				assert.equal(edits[1].range.end.character, 2);
			});

			/**
			 *  [ 
			 *   
			 *  ] 
			 * ---
			 * 
			 * 
			 * 
			 */
			it("empty double", function() {
				let document = createDocument("  \n  \n  ");
				let range = Range.create(Position.create(0, 1), Position.create(2, 1));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 3);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 2);
				assert.equal(edits[1].newText, "");
				assert.equal(edits[1].range.start.line, 1);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 1);
				assert.equal(edits[1].range.end.character, 2);
				assert.equal(edits[2].newText, "");
				assert.equal(edits[2].range.start.line, 2);
				assert.equal(edits[2].range.start.character, 0);
				assert.equal(edits[2].range.end.line, 2);
				assert.equal(edits[2].range.end.character, 2);
			});

			/**
			 *   [FROM node
			 * \tEXPOSE 8080
			 * HEALT]HCHECK NONE
			 */
			it("instructions", function() {
				let document = createDocument("  FROM node\n\tEXPOSE 8080\n  HEALTHCHECK NONE");
				let range = Range.create(Position.create(0, 3), Position.create(2, 5));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 3);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 2);
				assert.equal(edits[1].newText, "");
				assert.equal(edits[1].range.start.line, 1);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 1);
				assert.equal(edits[1].range.end.character, 1);

				document = createDocument("  FROM node\r\tEXPOSE 8080\r  HEALTHCHECK NONE");
				range = Range.create(Position.create(0, 3), Position.create(2, 5));
				edits = formatRange(document, range);
				assert.equal(edits.length, 3);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 2);
				assert.equal(edits[1].newText, "");
				assert.equal(edits[1].range.start.line, 1);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 1);
				assert.equal(edits[1].range.end.character, 1);

				document = createDocument("  FROM node\r\n\tEXPOSE 8080\r\n  HEALTHCHECK NONE");
				range = Range.create(Position.create(0, 3), Position.create(2, 5));
				edits = formatRange(document, range);
				assert.equal(edits.length, 3);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 0);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 0);
				assert.equal(edits[0].range.end.character, 2);
				assert.equal(edits[1].newText, "");
				assert.equal(edits[1].range.start.line, 1);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 1);
				assert.equal(edits[1].range.end.character, 1);
			});

			/**
			 * FROM node
			 * EXPOSE 8080\
			 * 8[081\
			 * 8082\
			 * 808]3
			 * ------------
			 * FROM node
			 * EXPOSE 8080\
			 * \t8081\
			 * \t8082\
			 * \t8083
			 */
			it("escaped indents selected", function() {
				let document = createDocument("FROM node\nEXPOSE 8080\\\n8081\\\n8082\\\n8083");
				let range = Range.create(Position.create(2, 1), Position.create(4, 3));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 3);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 2);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 2);
				assert.equal(edits[0].range.end.character, 0);
				assert.equal(edits[1].newText, "\t");
				assert.equal(edits[1].range.start.line, 3);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 3);
				assert.equal(edits[1].range.end.character, 0);
				assert.equal(edits[2].newText, "\t");
				assert.equal(edits[2].range.start.line, 4);
				assert.equal(edits[2].range.start.character, 0);
				assert.equal(edits[2].range.end.line, 4);
				assert.equal(edits[2].range.end.character, 0);
			});

			/**
			 * EXPOSE 8080 \
			 * [8081 \
			 * 8082]
			 * ------------
			 * EXPOSE 8080 \
			 * \t8081 \
			 * \t8082
			 */
			it("whitespace before escape", function() {
				let document = createDocument("EXPOSE 8080 \\\n8081 \\\n8082");
				let range = Range.create(Position.create(1, 0), Position.create(2, 4));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 2);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);
				assert.equal(edits[1].newText, "\t");
				assert.equal(edits[1].range.start.line, 2);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 2);
				assert.equal(edits[1].range.end.character, 0);
			});

			/**
			 * EXPOSE 8080 \
			 * [8081 \
			 * 
			 * 8082]
			 * ------------
			 * EXPOSE 8080 \
			 * \t8081 \
			 * 
			 * \t8082
			 */
			it("empty line after escape", function() {
				let document = createDocument("EXPOSE 8080 \\\n8081 \\\n\n8082");
				let range = Range.create(Position.create(1, 0), Position.create(3, 4));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 2);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);
				assert.equal(edits[1].newText, "\t");
				assert.equal(edits[1].range.start.line, 3);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 3);
				assert.equal(edits[1].range.end.character, 0);
			});

			/**
			 * EXPOSE 8080 \
			 * [8081 \
			 *  \t 
			 * 8082]
			 * ------------
			 * EXPOSE 8080 \
			 * \t8081 \
			 * 
			 * \t8082
			 */
			it("whitespace line after escape", function() {
				let document = createDocument("EXPOSE 8080 \\\n8081 \\\n \t \n8082");
				let range = Range.create(Position.create(1, 0), Position.create(3, 4));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 3);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);
				assert.equal(edits[1].newText, "");
				assert.equal(edits[1].range.start.line, 2);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 2);
				assert.equal(edits[1].range.end.character, 3);
				assert.equal(edits[2].newText, "\t");
				assert.equal(edits[2].range.start.line, 3);
				assert.equal(edits[2].range.start.character, 0);
				assert.equal(edits[2].range.end.line, 3);
				assert.equal(edits[2].range.end.character, 0);
			});

			/**
			 * EXPOSE 8080 \
			 * [8081 \
			 * # comment
			 * 8082]
			 * ------------
			 * EXPOSE 8080 \
			 * \t8081 \
			 * \t# comment
			 * \t8082
			 */
			it("comment after escape", function() {
				let document = createDocument("EXPOSE 8080 \\\n8081 \\\n# comment\n8082");
				let range = Range.create(Position.create(1, 0), Position.create(3, 4));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 3);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);
				assert.equal(edits[1].newText, "\t");
				assert.equal(edits[1].range.start.line, 2);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 2);
				assert.equal(edits[1].range.end.character, 0);
				assert.equal(edits[2].newText, "\t");
				assert.equal(edits[2].range.start.line, 3);
				assert.equal(edits[2].range.start.character, 0);
				assert.equal(edits[2].range.end.line, 3);
				assert.equal(edits[2].range.end.character, 0);
			});

			/**
			 * EXPOSE 8080 \
			 * [8081 \
			 * \t \t# comment
			 * 8082]
			 * ------------
			 * EXPOSE 8080 \
			 * \t8081 \
			 * \t# comment
			 * \t8082
			 */
			it("whitespace before comment after escape", function() {
				let document = createDocument("EXPOSE 8080 \\\n8081 \\\n\t \t# comment\n8082");
				let range = Range.create(Position.create(1, 0), Position.create(3, 4));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 3);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);
				assert.equal(edits[1].newText, "\t");
				assert.equal(edits[1].range.start.line, 2);
				assert.equal(edits[1].range.start.character, 0);
				assert.equal(edits[1].range.end.line, 2);
				assert.equal(edits[1].range.end.character, 3);
				assert.equal(edits[2].newText, "\t");
				assert.equal(edits[2].range.start.line, 3);
				assert.equal(edits[2].range.start.character, 0);
				assert.equal(edits[2].range.end.line, 3);
				assert.equal(edits[2].range.end.character, 0);
			});

			it("full file", function() {
				let document = createDocument("FROM node\n EXPOSE 8081\nHEALTHCHECK NONE");
				let range = Range.create(Position.create(0, 1), Position.create(1, 3));
				let edits = formatRange(document, range);
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 1);
			});
		});
	});

	describe("on type", function() {
		describe("backslash", function() {
			it("one line", function() {
				let document = createDocument("FROM node AS ");
				let edits = formatOnType(document, Position.create(0, 13), '\\');
				assert.equal(edits.length, 0);
			});

			it("two lines", function() {
				let document = createDocument("FROM node AS \n");
				let edits = formatOnType(document, Position.create(0, 13), '\\');
				assert.equal(edits.length, 0);

				document = createDocument("FROM node AS  \t\r\n");
				edits = formatOnType(document, Position.create(0, 13), '\\');
				assert.equal(edits.length, 0);

				document = createDocument("FROM node AS \nsetup");
				edits = formatOnType(document, Position.create(0, 13), '\\');
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);
			});

			it("three lines", function() {
				let document = createDocument("FROM node AS \n\n");
				let edits = formatOnType(document, Position.create(0, 13), '\\');
				assert.equal(edits.length, 0);

				document = createDocument("FROM node AS \nsetup\n");
				edits = formatOnType(document, Position.create(0, 13), '\\');
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);

				document = createDocument("FROM node \nAS \nsetup\n");
				edits = formatOnType(document, Position.create(0, 10), '\\');
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);
			});

			it("directive defined as backtick", function() {
				let document = createDocument("#escape=`\nFROM node AS \nsetup");
				let edits = formatOnType(document, Position.create(1, 13), '\\');
				assert.equal(edits.length, 0);
			});

			it("nested", function() {
				let document = createDocument("SHELL [ \"\", \n \"\" ]");
				let edits = formatOnType(document, Position.create(0, 9), '\\');
				assert.equal(edits.length, 0);
			});

			it("comment", function() {
				let document = createDocument("# comment\nFROM node");
				let edits = formatOnType(document, Position.create(0, 9), '\\');
				assert.equal(edits.length, 0);

				document = createDocument("FROM node\n# comment");
				edits = formatOnType(document, Position.create(0, 9), '\\');
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 1);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 1);
				assert.equal(edits[0].range.end.character, 0);
			});

			it("directive", function() {
				let document = createDocument("#escape=\nFROM node");
				let edits = formatOnType(document, Position.create(0, 8), '\\');
				assert.equal(edits.length, 0);
			});
		});

		describe("backtick", function() {
			it("ignored", function() {
				let document = createDocument("FROM node AS \nsetup");
				let edits = formatOnType(document, Position.create(0, 13), '`');
				assert.equal(edits.length, 0);
			});

			it("directive defined as backtick", function() {
				let document = createDocument("#escape=`\nFROM node AS \nsetup");
				let edits = formatOnType(document, Position.create(1, 13), '`');
				assert.equal(edits.length, 1);
				assert.equal(edits[0].newText, "\t");
				assert.equal(edits[0].range.start.line, 2);
				assert.equal(edits[0].range.start.character, 0);
				assert.equal(edits[0].range.end.line, 2);
				assert.equal(edits[0].range.end.character, 0);
			});
		});
	});
});
