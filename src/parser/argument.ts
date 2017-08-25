/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Range, Position } from 'vscode-languageserver';

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

	public isAfter(position: Position): boolean {
		if (this.range.end.line < position.line) {
			return true;
		}
		return this.range.start.line < position.line ? true : this.range.start.character > position.character;
	}

	public isBefore(position: Position): boolean {
		if (this.range.start.line < position.line) {
			return true;
		}
		return this.range.end.line > position.line ? false : this.range.end.character < position.character;
	}
}