/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, Position, DocumentHighlight, DocumentHighlightKind
} from 'vscode-languageserver';
import { DockerfileParser } from './parser/dockerfileParser';
import { From } from './parser/instructions/from';
import { DockerDefinition } from './dockerDefinition';
import { Util } from './docker';

export class DockerHighlight {

	public computeHighlightRanges(document: TextDocument, position: Position): DocumentHighlight[] {
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let provider = new DockerDefinition();
		let location = provider.computeDefinition(document, position);
		let image = location === null ? dockerfile.getContainingImage(position) : dockerfile.getContainingImage(location.range.start);
		let highlights = [];
		if (location === null) {
			for (let instruction of dockerfile.getCOPYs()) {
				let range = instruction.getFromValueRange();
				if (range && range.start.line === position.line && range.start.character <= position.character && position.character <= range.end.character) {
					let stage = instruction.getFromValue();

					for (let instruction of dockerfile.getCOPYs()) {
						let source = instruction.getFromValue();
						if (source === stage) {
							highlights.push(DocumentHighlight.create(instruction.getFromValueRange(), DocumentHighlightKind.Read));
						}
					}
					return highlights;
				}
			}

			for (const from of dockerfile.getFROMs()) {
				for (const variable of from.getVariables()) {
					if (Util.isInsideRange(position, variable.getNameRange())) {
						const name = variable.getName();
						for (const loopFrom of dockerfile.getFROMs()) {
							for (const fromVariable of loopFrom.getVariables()) {
								if (fromVariable.getName() === name) {
									highlights.push(DocumentHighlight.create(fromVariable.getNameRange(), DocumentHighlightKind.Read));
								}
							}
						}
						return highlights;
					}
				}
			}

			for (let instruction of image.getInstructions()) {
				for (let variable of instruction.getVariables()) {
					if (Util.isInsideRange(position, variable.getNameRange())) {
						let name = variable.getName();
						
						for (let instruction of image.getInstructions()) {
							if (!(instruction instanceof From)) {
								for (let variable of instruction.getVariables()) {
									if (variable.getName() === name) {
										highlights.push(DocumentHighlight.create(variable.getNameRange(), DocumentHighlightKind.Read));
									}
								}
							}
						}
						return highlights;
					}
				}
			}
		} else {

			let definition = document.getText().substring(document.offsetAt(location.range.start), document.offsetAt(location.range.end));
			for (let from of dockerfile.getFROMs()) {
				let range = from.getBuildStageRange();
				if (range && range.start.line === location.range.start.line) {
					highlights.push(DocumentHighlight.create(location.range, DocumentHighlightKind.Write));
					for (let instruction of dockerfile.getCOPYs()) {
						let source = instruction.getFromValue();
						if (source === definition) {
							highlights.push(DocumentHighlight.create(instruction.getFromValueRange(), DocumentHighlightKind.Read));
						}
					}
					return highlights;
				}
			}

			for (let arg of image.getARGs()) {
				let property = arg.getProperty();
				// property may be null if it's an ARG with no arguments
				if (property && property.getName() === definition) {
					highlights.push(DocumentHighlight.create(property.getNameRange(), DocumentHighlightKind.Write));
				}
			}

			for (let env of image.getENVs()) {
				for (let property of env.getProperties()) {
					if (property.getName() === definition) {
						highlights.push(DocumentHighlight.create(property.getNameRange(), DocumentHighlightKind.Write));
					}
				}
			}

			for (let instruction of image.getInstructions()) {
				// only highlight variables in non-FROM instructions
				if (!(instruction instanceof From)) {
					for (const variable of instruction.getVariables()) {
						if (variable.getName() === definition) {
							highlights.push(DocumentHighlight.create(variable.getNameRange(), DocumentHighlightKind.Read));
						}
					}
				}
			}

			for (const arg of dockerfile.getInitialARGs()) {
				const property = arg.getProperty();
				if (property && Util.rangeEquals(property.getNameRange(), location.range)) {
					for (const from of dockerfile.getFROMs()) {
						for (const variable of from.getVariables()) {
							if (variable.getName() === definition) {
								highlights.push(DocumentHighlight.create(variable.getNameRange(), DocumentHighlightKind.Read));
							}
						}
					}
				}
			}
		}

		return highlights;
	}
}
