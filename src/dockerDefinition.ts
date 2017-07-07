/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { TextDocument, Position, Location } from 'vscode-languageserver';
import { Copy } from '../parser/instructions/copy';
import { From } from '../parser/instructions/from';
import { DockerfileParser } from '../parser/dockerfileParser';

export class DockerDefinition {

	public computeDefinition(document: TextDocument, position: Position): Location {
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let froms: From[] = [];
		let copies: Copy[] = [];
		let stage = undefined;
		let highlights = [];
		for (let instruction of dockerfile.getFROMs()) {
			let range = instruction.getBuildStageRange();
			if (range && range.start.line === position.line && range.start.character <= position.character && position.character <= range.end.character) {
				return Location.create(document.uri, range);
			}
		}

		let source = undefined;
		for (let instruction of dockerfile.getCOPYs()) {
			let range = instruction.getFromValueRange();
			if (range && range.start.line === position.line && range.start.character <= position.character && position.character <= range.end.character) {
				source = instruction.getFromValue();
				break;
			}
		}

		if (source) {
			for (let instruction of dockerfile.getFROMs()) {
				if (instruction.getBuildStage() === source) {
					let range = instruction.getBuildStageRange();
					return Location.create(document.uri, range);
				}
			}
		}

		return null;
	}
}
