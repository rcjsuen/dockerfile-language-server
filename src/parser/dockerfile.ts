/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { Position } from 'vscode-languageserver';
import { Directive } from './directive';
import { Image } from './image';
import { Instruction } from './instruction';
import { DIRECTIVE_ESCAPE } from '../docker';

export class Dockerfile extends Image {

	private readonly initialInstructions: Instruction[] = [];
	private readonly buildStages: Image[] = [];
	private currentBuildStage: Image;
	private directive: Directive | null = null;

	/**
	 * Whether a FROM instruction has been added to this Dockerfile or not.
	 */
	private foundFrom = false;

	public getEscapeCharacter(): string {
		if (this.directive !== null && this.directive.getDirective() === DIRECTIVE_ESCAPE) {
			let value = this.directive.getValue();
			if (value === '\\' || value === '`') {
				return value;
			}
		}
		return '\\';
	}

	public getContainingImage(position: Position): Image {
		for (let buildStage of this.buildStages) {
			if (buildStage.contains(position)) {
				return buildStage;
			}
		}
		return this;
	}

	public addInstruction(instruction: Instruction): void {
		if (instruction.getKeyword() === "FROM") {
			this.currentBuildStage = new Image();
			this.buildStages.push(this.currentBuildStage);
			this.foundFrom = true;
		} else if (!this.foundFrom) {
			this.initialInstructions.push(instruction);
		}

		if (this.foundFrom) {
			this.currentBuildStage.addInstruction(instruction);
		}
		super.addInstruction(instruction);
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
