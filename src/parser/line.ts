/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';

export class Line {

	protected readonly document: TextDocument;
	private readonly range: Range;

	constructor(document: TextDocument, range: Range) {
		this.document = document;
		this.range = range;
	}

	public getRange(): Range {
		return this.range;
	}

	public getTextContent(): string {
		return this.document.getText().substring(this.document.offsetAt(this.range.start), this.document.offsetAt(this.range.end));
	}

	public isAfter(line: Line): boolean {
		return this.range.start.line > line.range.start.line;
	}
}