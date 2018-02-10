/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import { TextDocument, DocumentLink } from 'vscode-languageserver';
import { DockerLinks } from '../src/dockerLinks';

let linksProvider = new DockerLinks();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function assertLink(documentLink: DocumentLink, target: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(documentLink.target, target);
	assert.equal(documentLink.range.start.line, startLine);
	assert.equal(documentLink.range.start.character, startCharacter);
	assert.equal(documentLink.range.end.line, endLine);
	assert.equal(documentLink.range.end.character, endCharacter);
}

describe("Dockerfile links", function() {
	it("FROM node", function() {
		let document = createDocument("FROM node");
		let links = linksProvider.getLinks(document);
		assert.equal(links.length, 1);
		assertLink(links[0], "https://hub.docker.com/_/node/", 0, 5, 0, 9);
	});

	it("FROM node:latest", function() {
		let document = createDocument("FROM node:latest");
		let links = linksProvider.getLinks(document);
		assert.equal(links.length, 1);
		assertLink(links[0], "https://hub.docker.com/_/node/", 0, 5, 0, 9);
	});

	it("FROM node@sha256:613685c22f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700", function() {
		let document = createDocument("FROM node@sha256:613685c22f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700");
		let links = linksProvider.getLinks(document);
		assert.equal(links.length, 1);
		assertLink(links[0], "https://hub.docker.com/_/node/", 0, 5, 0, 9);
	});

	it("FROM microsoft/dotnet", function() {
		let document = createDocument("FROM microsoft/dotnet");
		let links = linksProvider.getLinks(document);
		assert.equal(links.length, 1);
		assertLink(links[0], "https://hub.docker.com/r/microsoft/dotnet/", 0, 5, 0, 21);
	});

	it("FROM microsoft/dotnet:sdk", function() {
		let document = createDocument("FROM microsoft/dotnet:sdk");
		let links = linksProvider.getLinks(document);
		assert.equal(links.length, 1);
		assertLink(links[0], "https://hub.docker.com/r/microsoft/dotnet/", 0, 5, 0, 21);
	});

	it("FROM microsoft/dotnet@sha256:5483e2b609c0f66c3ebd96666de7b0a74537613b43565879ecb0d0a73e845d7d", function() {
		let document = createDocument("FROM microsoft/dotnet@sha256:5483e2b609c0f66c3ebd96666de7b0a74537613b43565879ecb0d0a73e845d7d");
		let links = linksProvider.getLinks(document);
		assert.equal(links.length, 1);
		assertLink(links[0], "https://hub.docker.com/r/microsoft/dotnet/", 0, 5, 0, 21);
	});
});
