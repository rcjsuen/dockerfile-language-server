/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Line } from './line';

export class Instruction extends Line {

	private instruction: string;

	private instructionRange: Range;

	constructor(document: TextDocument, range: Range, instruction: string, instructionRange: Range) {
		super(document, range);
		this.instruction = instruction;
		this.instructionRange = instructionRange;
	}

	public getInstructionRange(): Range {
		return this.instructionRange;
	}

	public getInstruction(): string {
		return this.instruction;
	}

	public getKeyword(): string {
		return this.getInstruction().toUpperCase();
	}
}