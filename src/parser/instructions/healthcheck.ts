/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range, Position } from 'vscode-languageserver';
import { Argument } from '../argument';
import { Flag } from '../flag';
import { ModifiableInstruction } from './modifiableInstruction';

export class Healthcheck extends ModifiableInstruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	protected stopSearchingForFlags(argument: string): boolean {
		argument = argument.toUpperCase();
		return argument === "CMD" || argument === "NONE";
	}

	public getSubcommand(): Argument {
		let args = this.getArguments();
		for (let arg of args) {
			let value = arg.getValue().toUpperCase();
			if (value === "CMD" || value === "NONE") {
				return arg;
			}
		}
		return null;
	}
}
