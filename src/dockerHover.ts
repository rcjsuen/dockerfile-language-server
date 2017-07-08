/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextDocumentPositionParams, Hover
} from 'vscode-languageserver';
import { DockerfileParser } from '../parser/dockerfileParser';
import { Onbuild } from '../parser/instructions/onbuild';
import { DIRECTIVE_ESCAPE } from './docker';
import { MarkdownDocumentation } from './dockerMarkdown';

export class DockerHover {

	private markdown: MarkdownDocumentation;

	constructor(markdown: MarkdownDocumentation) {
		this.markdown = markdown;
	}

	onHover(document: TextDocument, textDocumentPosition: TextDocumentPositionParams): Hover | null {
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let directive = dockerfile.getDirective();

		if (textDocumentPosition.position.line === 0 && directive !== null && directive.getDirective() === DIRECTIVE_ESCAPE) {
			let range = directive.getNameRange();
			if (range.start.character <= textDocumentPosition.position.character && textDocumentPosition.position.character <= range.end.character) {
				return this.markdown.getMarkdown(DIRECTIVE_ESCAPE);
			}
		}

		for (let instruction of dockerfile.getInstructions()) {
			let instructionRange = instruction.getInstructionRange();
			if (instructionRange.start.line <= textDocumentPosition.position.line &&
					textDocumentPosition.position.line <= instructionRange.end.line &&
					instructionRange.start.character <= textDocumentPosition.position.character &&
					textDocumentPosition.position.character <= instructionRange.end.character) {
				return this.markdown.getMarkdown(instruction.getKeyword());
			}

			if (instruction instanceof Onbuild) {
				let range = instruction.getTriggerRange();
				if (range != null &&
						range.start.line <= textDocumentPosition.position.line &&
						textDocumentPosition.position.line <= range.end.line &&
						range.start.character <= textDocumentPosition.position.character &&
						textDocumentPosition.position.character <= range.end.character) {
					return this.markdown.getMarkdown(instruction.getTrigger());
				}
			}
		}
		return null;
	}
}
