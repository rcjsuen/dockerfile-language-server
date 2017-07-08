/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Line } from './line';
import { Util } from '../src/docker';

export class Comment extends Line {

	constructor(document: TextDocument, range: Range) {
		super(document, range);
	}

	/**
	 * Returns the content of this comment. This includes leading and
	 * trailing whitespace as well as the # symbol.
	 */
	public getContent(): string {
		let range = this.getContentRange();
		if (range === null) {
			return "";
		}
		return this.document.getText().substring(this.document.offsetAt(range.start), this.document.offsetAt(range.end));
	}

	/**
	 * Returns a range that includes the content of the comment
	 * excluding any leading and trailing whitespace as well as the #
	 * symbol.
	 */
	public getContentRange(): Range | null {
		let range = this.getRange();
		let raw = this.document.getText().substring(this.document.offsetAt(range.start), this.document.offsetAt(range.end));
		let start = -1;
		let end = -1;
		// skip the first # symbol
		for (let i = 1; i < raw.length; i++) {
			if (!Util.isWhitespace(raw.charAt(i))) {
				start = i;
				break;
			}
		}

		if (start === -1) {
			return null;
		}

		// go backwards up to the first # symbol
		for (let i = raw.length - 1; i >= 1; i--) {
			if (!Util.isWhitespace(raw.charAt(i))) {
				end = i + 1;
				break;
			}
		}

		return Range.create(this.document.positionAt(start), this.document.positionAt(end));
	}
}