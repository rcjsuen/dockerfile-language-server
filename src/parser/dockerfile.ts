/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { Comment } from './comment';
import { Directive } from './directive';
import { Instruction } from './instruction';
import { Arg } from './instructions/arg';
import { Cmd } from './instructions/cmd';
import { Copy } from './instructions/copy';
import { Env } from './instructions/env';
import { Entrypoint } from './instructions/entrypoint';
import { From } from './instructions/from';
import { Healthcheck } from './instructions/healthcheck';
import { Onbuild } from './instructions/onbuild';
import { StopSignal } from './instructions/stopSignal';
import { Workdir } from './instructions/workdir';
import { User } from './instructions/user';
import { DIRECTIVE_ESCAPE } from '../docker';

export class Dockerfile {

	private readonly comments: Comment[] = [];
	private directive: Directive | null = null;
	private readonly instructions: Instruction[] = [];

	public getEscapeCharacter(): string {
		if (this.directive !== null && this.directive.getDirective() === DIRECTIVE_ESCAPE) {
			let value = this.directive.getValue();
			if (value === '\\' || value === '`') {
				return value;
			}
		}
		return '\\';
	}

	public addComment(comment: Comment): void {
		this.comments.push(comment);
	}

	public getComments(): Comment[] {
		return this.comments;
	}

	public addInstruction(instruction: Instruction): void {
		this.instructions.push(instruction);
	}

	public getInstructions(): Instruction[] {
		return this.instructions;
	}

	/**
	 * Gets all the ARG instructions that are defined in this Dockerfile.
	 */
	public getARGs(): Arg[] {
		let args = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Arg) {
				args.push(instruction);
			}
		}
		return args;
	}

	/**
	 * Gets all the CMD instructions that are defined in this Dockerfile.
	 */
	public getCMDs(): Cmd[] {
		let cmds = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Cmd) {
				cmds.push(instruction);
			}
		}
		return cmds;
	}

	/**
	 * Gets all the COPY instructions that are defined in this Dockerfile.
	 */
	public getCOPYs(): Copy[] {
		let copies = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Copy) {
				copies.push(instruction);
			}
		}
		return copies;
	}

	/**
	 * Gets all the ENTRYPOINT instructions that are defined in this Dockerfile.
	 */
	public getENTRYPOINTs(): Entrypoint[] {
		let froms = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Entrypoint) {
				froms.push(instruction);
			}
		}
		return froms;
	}

	/**
	 * Gets all the ENV instructions that are defined in this Dockerfile.
	 */
	public getENVs(): Env[] {
		let args = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Env) {
				args.push(instruction);
			}
		}
		return args;
	}

	/**
	 * Gets all the FROM instructions that are defined in this Dockerfile.
	 */
	public getFROMs(): From[] {
		let froms = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof From) {
				froms.push(instruction);
			}
		}
		return froms;
	}

	/**
	 * Gets all the HEALTHCHECK instructions that are defined in this Dockerfile.
	 */
	public getHEALTHCHECKs(): Healthcheck[] {
		let froms = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Healthcheck) {
				froms.push(instruction);
			}
		}
		return froms;
	}

	public getOnbuildTriggers(): Instruction[] {
		let triggers = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Onbuild) {
				let trigger = instruction.getTriggerInstruction();
				if (trigger) {
					triggers.push(trigger);
				}
			}
		}
		return triggers;
	}

	public setDirective(directive: Directive): void {
		this.directive = directive;
	}

	public getDirective(): Directive | null {
		return this.directive;
	}

	public getVariableNames(currentLine: number): string[] {
		let variables = [
			"FTP_PROXY", "ftp_proxy",
			"HTTP_PROXY", "http_proxy",
			"HTTPS_PROXY", "https_proxy",
			"NO_PROXY", "no_proxy"
		];

		for (let arg of this.getARGs()) {
			if (arg.isBefore(currentLine)) {
				let variable = arg.getProperty().getName();
				if (variables.indexOf(variable) === -1) {
					variables.push(variable);
				}
			}
		}

		for (let env of this.getENVs()) {
			if (env.isBefore(currentLine)) {
				for (let property of env.getProperties()) {
					let variable = property.getName();
					if (variables.indexOf(variable) === -1) {
						variables.push(variable);
					}
				}
			}
		}

		variables.sort((a: string, b: string) => {
			if (a.toLowerCase() === b.toLowerCase()) {
				// put uppercase variables first
				return a.localeCompare(b) * -1;	
			}
			return a.localeCompare(b);
		});

		return variables;
	}

	public getVariableValue(variable: string, line: number): string {
		let envs = this.getENVs();
		for (let i = envs.length - 1; i >= 0; i--) {
			if (envs[i].isBefore(line)) {
				for (let property of envs[i].getProperties()) {
					if (property.getName() === variable) {
						return property.getValue();
					}
				}
			}
		}

		let args = this.getARGs();
		for (let i = args.length - 1; i >= 0; i--) {
			if (args[i].isBefore(line)) {
				let property = args[i].getProperty();
				if (property && property.getName() === variable) {
					return property.getValue();
				}
			}
		}
		return undefined;
	}

}
