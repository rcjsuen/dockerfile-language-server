/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Range } from 'vscode-languageserver';

export class Variable {

	private readonly name: string;
	private readonly nameRange: Range;
	private readonly range: Range;

	constructor(name: string, nameRange: Range, range: Range) {
		this.name = name;
		this.nameRange = nameRange;
		this.range = range;
	}

	public getName(): string {
		return this.name;
	}

	public getNameRange(): Range {
		return this.nameRange;
	}

	/**
	 * Returns the range of the entire variable. This includes the symbols for
	 * the declaration of the variable such as the $, {, and } symbols.
	 * 
	 * @return the range in the document that this variable encompasses in its
	 *         entirety
	 */
	public getRange(): Range {
		return this.range;
	}
}
