/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as child_process from "child_process";
import * as assert from "assert";

import {
	TextEdit, TextDocument, Position, Range, Location
} from 'vscode-languageserver';
import { DockerDefinition } from '../src/dockerDefinition';

let provider = new DockerDefinition();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function computeDefinition(document: TextDocument, position: Position): Location {
	return provider.computeDefinition(document, position);
}

function assertLocation(location: Location, uri: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(location.uri, uri);
	assert.equal(location.range.start.line, startLine);
	assert.equal(location.range.start.character, startCharacter);
	assert.equal(location.range.end.line, endLine);
	assert.equal(location.range.end.character, endCharacter);
}

describe("Dockerfile Document Highlight tests", function() {
	describe("FROM", function() {
		describe("AS name", function() {
			it("no COPY", function() {
				let document = createDocument("FROM node AS bootstrap");
				let location = computeDefinition(document, Position.create(0, 17));
				assertLocation(location, document.uri, 0, 13, 0, 22);
			});

			it("COPY", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor in the FROM
				let location = computeDefinition(document, Position.create(0, 17));
				assertLocation(location, document.uri, 0, 13, 0, 22);

				// cursor in the COPY
				location = computeDefinition(document, Position.create(2, 16));
				assertLocation(location, document.uri, 0, 13, 0, 22);
			});

			it("source mismatch", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap2 /git/bin/app .");
				// cursor in the FROM
				let location = computeDefinition(document, Position.create(0, 17));
				assertLocation(location, document.uri, 0, 13, 0, 22);

				// cursor in the COPY
				location = computeDefinition(document, Position.create(2, 16));
				assert.equal(location, null);
			});
		});

		describe("invalid", function() {
			it("position", function() {
				let document = createDocument("FROM node AS bootstrap   \nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor after the AS source image
				let location = computeDefinition(document, Position.create(0, 24));
				assert.equal(location, null);
				// cursor after the COPY --from
				location = computeDefinition(document, Position.create(2, 22));
				assert.equal(location, null);
			});

			it("COPY bootstrap", function() {
				let document = createDocument("FROM node AS bootstrap\nCOPY bootstrap /git/build/");
				// cursor after the AS source image
				let location = computeDefinition(document, Position.create(1, 10));
				assert.equal(location, null);
			});
		});
	});
});
