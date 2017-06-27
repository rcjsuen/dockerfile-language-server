/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Line } from './line';

export class Comment extends Line {

	constructor(document: TextDocument, range: Range) {
		super(document, range);
	}
}