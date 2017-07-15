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
import { Util, DIRECTIVE_ESCAPE } from './docker';
import { MarkdownDocumentation } from './dockerMarkdown';
import { DockerDefinition } from './dockerDefinition';

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
			if (Util.isInsideRange(textDocumentPosition.position, range)) {
				return this.markdown.getMarkdown(DIRECTIVE_ESCAPE);
			}
		}

		for (let instruction of dockerfile.getInstructions()) {
			let instructionRange = instruction.getInstructionRange();
			if (Util.isInsideRange(textDocumentPosition.position, instructionRange)) {
				return this.markdown.getMarkdown(instruction.getKeyword());
			}

			if (instruction instanceof Onbuild) {
				// hovering over a trigger instruction of an ONBUILD
				let range = instruction.getTriggerRange();
				if (Util.isInsideRange(textDocumentPosition.position, range)) {
					return this.markdown.getMarkdown(instruction.getTrigger());
				}
			}

			if (instruction instanceof Arg) {
				// hovering over an argument defined by ARG
				let property = instruction.getProperty();
				if (property && Util.isInsideRange(textDocumentPosition.position, property.getNameRange()) && property.getValue() !== null) {
					return {
						contents: property.getValue()
					};
				}
			}
		}

		let property = DockerDefinition.computeVariableDefinition(dockerfile, textDocumentPosition.position);
		if (property && property.getValue() !== null) {
			return { contents: property.getValue() };
		}

		return null;
	}
}
