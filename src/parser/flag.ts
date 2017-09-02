/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Range } from 'vscode-languageserver';

export class Flag {

	private readonly content: string;
	private readonly range: Range;
	private readonly name: string;
	private readonly nameRange: Range;
	private readonly value: string;
	private readonly valueRange: Range;

	constructor(content: string, range: Range, name: string, nameRange: Range, value: string, valueRange: Range) {
		this.content = content;
		this.range = range;
		this.name = name;
		this.nameRange = nameRange;
		this.value = value;
		this.valueRange = valueRange;
	}

	public toString(): string {
		return this.content;
	}

	public getRange(): Range {
		return this.range;
	}

	public getName(): string {
		return this.name;
	}

	public getNameRange(): Range {
		return this.nameRange;
	}

	public getValue(): string {
		return this.value;
	}

	public getValueRange(): Range {
		return this.valueRange;
	}
}
