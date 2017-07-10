/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextDocumentPositionParams, Hover, Range, Position
} from 'vscode-languageserver';
import { DockerfileParser } from './parser/dockerfileParser';
import { Arg } from './parser/instructions/arg';
import { Onbuild } from './parser/instructions/onbuild';
import { DIRECTIVE_ESCAPE } from './docker';
import { MarkdownDocumentation } from './dockerMarkdown';

export class DockerHover {

	private markdown: MarkdownDocumentation;

	constructor(markdown: MarkdownDocumentation) {
		this.markdown = markdown;
	}

	/**
	 * Determines if the given position is contained within the given range.
	 * 
	 * @param position the position to check
	 * @param range the range to see if the position is inside of
	 */
	private isInsideRange(position: Position, range: Range): boolean {
		return range != null &&
				range.start.line <= position.line &&
				position.line <= range.end.line &&
				range.start.character <= position.character &&
				position.character <= range.end.character;
	}

	onHover(document: TextDocument, textDocumentPosition: TextDocumentPositionParams): Hover | null {
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let directive = dockerfile.getDirective();

		if (textDocumentPosition.position.line === 0 && directive !== null && directive.getDirective() === DIRECTIVE_ESCAPE) {
			let range = directive.getNameRange();
			if (this.isInsideRange(textDocumentPosition.position, range)) {
				return this.markdown.getMarkdown(DIRECTIVE_ESCAPE);
			}
		}

		for (let instruction of dockerfile.getInstructions()) {
			let instructionRange = instruction.getInstructionRange();
			if (this.isInsideRange(textDocumentPosition.position, instructionRange)) {
				return this.markdown.getMarkdown(instruction.getKeyword());
			}

			if (instruction instanceof Onbuild) {
				// hovering over a trigger instruction of an ONBUILD
				let range = instruction.getTriggerRange();
				if (this.isInsideRange(textDocumentPosition.position, range)) {
					return this.markdown.getMarkdown(instruction.getTrigger());
				}
			}

			if (instruction instanceof Arg) {
				// hovering over an argument defined by ARG
				let range = instruction.getNameRange();
				if (this.isInsideRange(textDocumentPosition.position, range)) {
					return {
						contents: instruction.getValue()
					};
				}
			}
		}
		return null;
	}
}
