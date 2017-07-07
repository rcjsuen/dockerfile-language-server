/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { TextDocument, Position, TextEdit } from 'vscode-languageserver';
import { DockerHighlight } from './dockerHighlight';

export class DockerRename {

	public rename(document: TextDocument, position: Position, newName: string): TextEdit[] {
		let edits = [];
		let highlighter = new DockerHighlight();
		let highlightRanges = highlighter.computeHighlightRanges(document, position);
		if (highlightRanges.length !== 0) {
			for (let highlightRange of highlightRanges) {
				edits.push(TextEdit.replace(highlightRange.range, newName));
			}
		}
		return edits;
	}
}
