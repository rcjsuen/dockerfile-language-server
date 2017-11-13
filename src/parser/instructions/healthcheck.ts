/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Dockerfile } from '../dockerfile';
import { Argument } from '../argument';
import { ModifiableInstruction } from './modifiableInstruction';

export class Healthcheck extends ModifiableInstruction {

	constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, dockerfile, escapeChar, instruction, instructionRange);
	}

	protected stopSearchingForFlags(argument: string): boolean {
		argument = argument.toUpperCase();
		return argument === "CMD" || argument === "NONE";
	}

	public getSubcommand(): Argument | null {
		let args = this.getArguments();
		return args.length !== 0 ? args[0] : null;
	}
}
