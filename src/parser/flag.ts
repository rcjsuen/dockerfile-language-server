/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Range } from 'vscode-languageserver';

export class Flag {

	private readonly name: string;
	private readonly nameRange: Range;
	private readonly value: string;
	private readonly valueRange: Range;

	constructor(name: string, nameRange: Range, value: string, valueRange: Range) {
		this.name = name;
		this.nameRange = nameRange;
		this.value = value;
		this.valueRange = valueRange;
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
