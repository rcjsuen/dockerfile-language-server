/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';

export class Line {

	protected document: TextDocument;
	private range: Range;

	constructor(document: TextDocument, range: Range) {
		this.document = document;
		this.range = range;
	}

	public getRange(): Range {
		return this.range;
	}
}