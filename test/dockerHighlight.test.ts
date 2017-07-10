/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import {
	TextDocument, Position, DocumentHighlight, DocumentHighlightKind
} from 'vscode-languageserver';
import { DockerHighlight } from '../src/dockerHighlight';

let highlighter = new DockerHighlight();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function computeHighlightRanges(document: TextDocument, line: number, character: number): DocumentHighlight[] {
	return highlighter.computeHighlightRanges(document, Position.create(line, character));
}

function assertHighlight(highlight: DocumentHighlight, kind: DocumentHighlightKind, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(highlight.kind, kind);
	assert.equal(highlight.range.start.line, startLine);
	assert.equal(highlight.range.start.character, startCharacter);
	assert.equal(highlight.range.end.line, endLine);
	assert.equal(highlight.range.end.character, endCharacter);
}

describe("Dockerfile Document Highlight tests", function() {
	describe("FROM", function() {
		describe("AS name", function() {
			it("no COPY", function() {
				let document = createDocument("FROM node AS bootstrap");
				let ranges = computeHighlightRanges(document, 0, 17);
				assert.equal(ranges.length, 1);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
			});

			it("COPY", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor in the FROM
				let ranges = computeHighlightRanges(document, 0, 17);
				assert.equal(ranges.length, 2);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
				assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 12, 2, 21);

				// cursor in the COPY
				ranges = computeHighlightRanges(document, 2, 16);
				assert.equal(ranges.length, 2);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
				assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 12, 2, 21);
			});

			it("COPY incomplete", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap");
				// cursor in the FROM
				let ranges = computeHighlightRanges(document, 0, 17);
				assert.equal(ranges.length, 2);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
				assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 12, 2, 21);

				// cursor in the COPY
				ranges = computeHighlightRanges(document, 2, 16);
				assert.equal(ranges.length, 2);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
				assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 12, 2, 21);
			});

			it("source mismatch", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap2 /git/bin/app .");
				// cursor in the FROM
				let ranges = computeHighlightRanges(document, 0, 17);
				assert.equal(ranges.length, 1);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);

				// cursor in the COPY
				ranges = computeHighlightRanges(document, 2, 16);
				assert.equal(ranges.length, 1);
				assertHighlight(ranges[0], DocumentHighlightKind.Read, 2, 12, 2, 22);
			});
		});

		describe("invalid", function() {
			it("position", function() {
				let document = createDocument("FROM node AS bootstrap   \nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor after the AS source image
				let ranges = computeHighlightRanges(document, 0, 24);
				assert.equal(ranges.length, 0);
				// cursor after the COPY --from
				ranges = computeHighlightRanges(document, 2, 22);
				assert.equal(ranges.length, 0);
			});

			it("COPY bootstrap", function() {
				let document = createDocument("FROM node AS bootstrap\nCOPY bootstrap /git/build/");
				// cursor after the AS source image
				let ranges = computeHighlightRanges(document, 0, 17);
				assert.equal(ranges.length, 1);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
				// cursor on COPY bootstrap
				ranges = computeHighlightRanges(document, 1, 10);
				assert.equal(ranges.length, 0);
			});
		});
	});

	describe("ARG", function() {
		it("referenced variable ${var}", function() {
			let document = createDocument("ARG var=value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
			let ranges = computeHighlightRanges(document, 0, 5);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 17);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 11);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 14);

			ranges = computeHighlightRanges(document, 1, 13);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 17);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 11);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 14);

			ranges = computeHighlightRanges(document, 2, 7);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 17);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 11);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 14);

			ranges = computeHighlightRanges(document, 3, 11);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 17);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 11);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 14);
		});

		it("referenced variable ${var} no value", function() {
			let document = createDocument("ARG var\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
			let ranges = computeHighlightRanges(document, 0, 5);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 17);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 11);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 14);

			ranges = computeHighlightRanges(document, 1, 13);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 17);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 11);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 14);

			ranges = computeHighlightRanges(document, 2, 7);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 17);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 11);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 14);

			ranges = computeHighlightRanges(document, 3, 11);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 17);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 11);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 14);
		});

		it("referenced variable $var", function() {
			let document = createDocument("ARG var=value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
			let ranges = computeHighlightRanges(document, 0, 5);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 15);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 9);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 12);

			ranges = computeHighlightRanges(document, 1, 13);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 15);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 9);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 12);

			ranges = computeHighlightRanges(document, 2, 7);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 15);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 9);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 12);

			ranges = computeHighlightRanges(document, 3, 11);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 15);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 9);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 12);
		});

		it("referenced variable $var no value", function() {
			let document = createDocument("ARG var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
			let ranges = computeHighlightRanges(document, 0, 5);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 15);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 9);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 12);

			ranges = computeHighlightRanges(document, 1, 13);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 15);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 9);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 12);

			ranges = computeHighlightRanges(document, 2, 7);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 15);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 9);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 12);

			ranges = computeHighlightRanges(document, 3, 11);
			assert.equal(ranges.length, 4);
			assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 4, 0, 7);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 1, 11, 1, 15);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 2, 5, 2, 9);
			assertHighlight(ranges[3], DocumentHighlightKind.Read, 3, 8, 3, 12);
		});
	});

	describe("non-existent variable", function() {
		it("${var}", function() {
			let document = createDocument("FROM busybox\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
			let ranges = computeHighlightRanges(document, 1, 13);
			assert.equal(ranges.length, 3);
			assertHighlight(ranges[0], DocumentHighlightKind.Read, 1, 11, 1, 17);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 5, 2, 11);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 3, 8, 3, 14);

			ranges = computeHighlightRanges(document, 2, 7);
			assert.equal(ranges.length, 3);
			assertHighlight(ranges[0], DocumentHighlightKind.Read, 1, 11, 1, 17);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 5, 2, 11);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 3, 8, 3, 14);

			ranges = computeHighlightRanges(document, 3, 11);
			assert.equal(ranges.length, 3);
			assertHighlight(ranges[0], DocumentHighlightKind.Read, 1, 11, 1, 17);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 5, 2, 11);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 3, 8, 3, 14);
		});

		it("referenced variable $var no value", function() {
			let document = createDocument("FROM busybox\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
			let ranges = computeHighlightRanges(document, 1, 13);
			assert.equal(ranges.length, 3);
			assertHighlight(ranges[0], DocumentHighlightKind.Read, 1, 11, 1, 15);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 5, 2, 9);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 3, 8, 3, 12);

			ranges = computeHighlightRanges(document, 2, 7);
			assert.equal(ranges.length, 3);
			assertHighlight(ranges[0], DocumentHighlightKind.Read, 1, 11, 1, 15);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 5, 2, 9);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 3, 8, 3, 12);

			ranges = computeHighlightRanges(document, 3, 11);
			assert.equal(ranges.length, 3);
			assertHighlight(ranges[0], DocumentHighlightKind.Read, 1, 11, 1, 15);
			assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 5, 2, 9);
			assertHighlight(ranges[2], DocumentHighlightKind.Read, 3, 8, 3, 12);
		});
	});
});
