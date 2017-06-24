/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as child_process from "child_process";
import * as assert from "assert";

import { TextDocument, Hover, Position } from 'vscode-languageserver';
import { MarkdownDocumentation } from '../src/dockerMarkdown';
import { DockerHover } from '../src/dockerHover';

let markdownDocumentation = new MarkdownDocumentation();
let hoverProvider = new DockerHover(markdownDocumentation);

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function onHover(document: TextDocument, line: number, character: number): Hover {
	let textDocumentPosition = {
		textDocument: {
			uri: document.uri
		},
		position: Position.create(line, character)
	};
	return hoverProvider.onHover(document, textDocumentPosition);
}

describe("Dockerfile hover", function() {
	describe("whitespace", function() {
		it("empty file", function() {
			let document = createDocument("");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, null);
		});
	});

	describe("comments", function() {
		it("# FROM node", function() {
			let document = createDocument("3");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, null);
		});
	});

	describe("keywords", function() {
		it("FROM", function() {
			let document = createDocument("FROM node");
			let hover = onHover(document, 0, 2);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("froM", function() {
			let document = createDocument("froM node");
			let hover = onHover(document, 0, 2);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("fr\\\\noM", function() {
			let document = createDocument("fr\\\noM node");
			let hover = onHover(document, 1, 0);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("HEALTHCHECK NONE", function() {
			let document = createDocument("HEALTHCHECK NONE");
			let hover = onHover(document, 0, 14);
			assert.equal(hover, null);
		});
	});

	describe("keyword nesting", function() {
		it("ONBUILD EXPOSE", function() {
			let document = createDocument("ONBUILD EXPOSE 8080");
			let hover = onHover(document, 0, 11);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("ONBUILD EXPOSE escaped on newline", function() {
			let document = createDocument("ONBUILD \\\nEXPOSE 8080");
			let hover = onHover(document, 1, 3);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("ONBUILD EXPOSE escaped on newline with space", function() {
			let document = createDocument("ONBUILD \\\n EXPOSE 8080");
			let hover = onHover(document, 1, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});
	});
});
