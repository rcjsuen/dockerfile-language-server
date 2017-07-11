/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { TextDocument, Position, Range, TextEdit } from 'vscode-languageserver';
import { DockerHighlight } from './dockerHighlight';

export class DockerRename {

	public rename(document: TextDocument, position: Position, newName: string): TextEdit[] {
		let edits = [];
		let highlighter = new DockerHighlight();
		let highlightRanges = highlighter.computeHighlightRanges(document, position);
		if (highlightRanges.length !== 0) {
			let content = document.getText();
			for (let highlightRange of highlightRanges) {
				let start = document.offsetAt(highlightRange.range.start);
				let end = document.offsetAt(highlightRange.range.end);
				let target = content.substring(start, end);
				if (target.indexOf("${") === 0) {
					let range = Range.create(document.positionAt(start + 2), document.positionAt(end - 1));
					edits.push(TextEdit.replace(range, newName));
				} else if (target.indexOf('$') === 0) {
					let range = Range.create(document.positionAt(start + 1), highlightRange.range.end);
					edits.push(TextEdit.replace(range, newName));
				} else {
					edits.push(TextEdit.replace(highlightRange.range, newName));
				}
			}
		}
		return edits;
	}
}
