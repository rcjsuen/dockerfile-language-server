/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import { TextDocument, Position, TextEdit } from 'vscode-languageserver';
import { DockerRename } from '../src/dockerRename';

let renameSupport = new DockerRename();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function rename(document: TextDocument, position: Position, newName: string): TextEdit[] {
	return renameSupport.rename(document, position, newName);
}

function assertEdit(edit: TextEdit, newName: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(edit.newText, newName);
	assert.equal(edit.range.start.line, startLine);
	assert.equal(edit.range.start.character, startCharacter);
	assert.equal(edit.range.end.line, endLine);
	assert.equal(edit.range.end.character, endCharacter);
}

describe("Dockerfile Document Rename tests", function() {
	describe("FROM", function() {
		describe("AS name", function() {
			it("no COPY", function() {
				let document = createDocument("FROM node AS bootstrap");
				let edits = rename(document, Position.create(0, 17), "renamed");
				assert.equal(1, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
			});

			it("COPY", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor in the FROM
				let edits = rename(document, Position.create(0, 17), "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);

				// cursor in the COPY
				edits = rename(document, Position.create(2, 16), "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);
			});

			it("COPY incomplete", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap");
				// cursor in the FROM
				let edits = rename(document, Position.create(0, 17), "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);

				// cursor in the COPY
				edits = rename(document, Position.create(2, 16), "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);
			});

			it("source mismatch", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap2 /git/bin/app .");
				// cursor in the FROM
				let edits = rename(document, Position.create(0, 17), "renamed");
				assert.equal(edits.length, 1);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);

				// cursor in the COPY
				edits = rename(document, Position.create(2, 16), "renamed");
				assert.equal(edits.length, 1);
				assertEdit(edits[0], "renamed", 2, 12, 2, 22);

				document = createDocument("FROM node AS bootstrap\nCOPY bootstrap /git/build/");
				// cursor in the FROM
				edits = rename(document, Position.create(0, 17), "renamed");
				assert.equal(edits.length, 1);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
			});
		});

		describe("invalid", function() {
			it("position", function() {
				let document = createDocument("FROM node AS bootstrap   \nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor after the AS source image
				let edits = rename(document, Position.create(0, 24), "renamed");
				assert.equal(edits.length, 0);
				// cursor after the COPY --from
				edits = rename(document, Position.create(2, 22), "renamed");
				assert.equal(edits.length, 0);
			});

			it("COPY bootstrap", function() {
				let document = createDocument("FROM node AS bootstrap\nCOPY bootstrap /git/build/");
				// cursor on COPY bootstrap
				let edits = rename(document, Position.create(1, 10), "renamed");
				assert.equal(edits.length, 0);
			});
		});
	});
});
