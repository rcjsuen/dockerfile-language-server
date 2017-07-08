/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Range } from 'vscode-languageserver';

export class Argument {

	private readonly value: string
	private readonly range: Range;

	constructor(value: string, range: Range) {
		this.value = value;
		this.range = range;
	}

	public getRange(): Range {
		return this.range;
	}

	public getValue(): string {
		return this.value;
	}
}