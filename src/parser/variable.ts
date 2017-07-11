/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Range } from 'vscode-languageserver';

export class Variable {

	private readonly name: string;
	private readonly nameRange: Range;

	constructor(name: string, nameRange: Range) {
		this.name = name;
		this.nameRange = nameRange;
	}

	public getName(): string {
		return this.name;
	}

	public getNameRange(): Range {
		return this.nameRange;
	}
}
