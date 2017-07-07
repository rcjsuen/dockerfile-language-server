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
import { DockerDefinition } from './dockerDefinition';

export class DockerHighlight {

	public computeHighlightRanges(document: TextDocument, position: Position): DocumentHighlight[] {
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let provider = new DockerDefinition();
		let location = provider.computeDefinition(document, position);
		let highlights = [];
		let stage = undefined;
		if (location === null) {
			for (let instruction of dockerfile.getCOPYs()) {
				let range = instruction.getFromValueRange();
				if (range && range.start.line === position.line && range.start.character <= position.character && position.character <= range.end.character) {
					stage = instruction.getFromValue();
					break;
				}
			}
		} else {
			highlights.push(DocumentHighlight.create(location.range, DocumentHighlightKind.Write));
			stage = document.getText().substring(document.offsetAt(location.range.start), document.offsetAt(location.range.end));
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
