/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextEdit, Range, Position,
	DocumentHighlight, DocumentHighlightKind
} from 'vscode-languageserver';
import { Util, KEYWORDS, DIRECTIVE_ESCAPE } from './docker';
import { Copy } from '../parser/instructions/copy';
import { From } from '../parser/instructions/from';
import { DockerfileParser } from '../parser/dockerfileParser';

export class DockerHighlight {

	public computeHighlightRanges(document: TextDocument, position: Position): DocumentHighlight[] {
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let froms: From[] = [];
		let copies: Copy[] = [];
		let stage = undefined;
		let highlights = [];
		for (let instruction of dockerfile.getFROMs()) {
			let range = instruction.getBuildStageRange();
			if (range && range.start.line === position.line && range.start.character <= position.character && position.character <= range.end.character) {
				highlights.push(DocumentHighlight.create(range, DocumentHighlightKind.Write));
				stage = instruction.getBuildStage();
				break;
			}
		}

		if (stage === undefined) {
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
						highlights.push(DocumentHighlight.create(range, DocumentHighlightKind.Write));
						stage = instruction.getBuildStage();
						break;
					}
				}

				if (stage === undefined) {
					stage = source;
				}
			}
		}

		if (stage !== undefined) {
			for (let instruction of dockerfile.getCOPYs()) {
				let source = instruction.getFromValue();
				if (source === stage) {
					highlights.push(DocumentHighlight.create(instruction.getFromValueRange(), DocumentHighlightKind.Read));
				}
			}
		}

		return highlights;
	}
}
