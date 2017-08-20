/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import {
	TextDocument, Position, Range, SignatureHelp
} from 'vscode-languageserver';
import { PlainTextDocumentation } from '../src/dockerPlainText';
import { KEYWORDS, DIRECTIVE_ESCAPE } from '../src/docker';
import { DockerSignatures } from '../src/dockerSignatures';

let docs = new PlainTextDocumentation();
let signatures = new DockerSignatures();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function compute(content: string, line: number, character: number): SignatureHelp {
	let document = createDocument(content);
	return signatures.computeSignatures(document, Position.create(line, character));
}

function assertNoSignatures(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, null);
	assert.equal(signatureHelp.activeParameter, null);
	assert.equal(signatureHelp.signatures.length, 0);
}

function assertEscape(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.signatures[0].label, "escape=`\\`");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureEscape"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 1);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "\\");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureEscape_Param"));
}

function assertCopy_FlagFrom(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.signatures[0].label, "--from=stage");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureCopyFlagFrom"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 1);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "stage");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureCopyFlagFrom_Param"));
}

function assertHealthcheck_FlagInterval(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.signatures[0].label, "HEALTHCHECK --interval=30s ...");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureHealthcheck"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 1);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "30s");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureHealthcheckFlagInterval_Param"));
}

function assertHealthcheck_FlagRetries(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.signatures[0].label, "HEALTHCHECK --retries=3 ...");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureHealthcheck"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 1);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "3");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureHealthcheckFlagRetries_Param"));
}

function assertHealthcheck_FlagStartPeriod(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.signatures[0].label, "HEALTHCHECK --start-period=5s ...");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureHealthcheck"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 1);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "5s");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureHealthcheckFlagStartPeriod_Param"));
}

function assertHealthcheck_FlagTimeout(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.signatures[0].label, "HEALTHCHECK --timeout=30s ...");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureHealthcheck"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 1);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "30s");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureHealthcheckFlagTimeout_Param"));
}

describe("Dockerfile Signature Tests", function() {
	describe("directives", function() {
		describe("escape", function() {
			it("ok", function() {
				let signatureHelp = compute("#escape=", 0, 8);
				assertEscape(signatureHelp);

				signatureHelp = compute("# escape=", 0, 9);
				assertEscape(signatureHelp);

				signatureHelp = compute("#escape =", 0, 9);
				assertEscape(signatureHelp);

				signatureHelp = compute("#escape= ", 0, 9);
				assertEscape(signatureHelp);

				signatureHelp = compute("#ESCAPE=", 0, 8);
				assertEscape(signatureHelp);

				signatureHelp = compute("# ESCAPE=", 0, 9);
				assertEscape(signatureHelp);

				signatureHelp = compute("#ESCAPE =", 0, 9);
				assertEscape(signatureHelp);

				signatureHelp = compute("#esCaPE=", 0, 8);
				assertEscape(signatureHelp);

				signatureHelp = compute("# esCaPE=", 0, 9);
				assertEscape(signatureHelp);

				signatureHelp = compute("#esCaPE =", 0, 9);
				assertEscape(signatureHelp);
			});

			it("invalid", function() {
				let signatureHelp = compute("#property=", 0, 10);
				assertNoSignatures(signatureHelp);
			});
		});
	});

	function testCopy(trigger: boolean) {
		let onbuild = trigger ? "ONBUILD " : "";
		let triggerOffset = trigger ? 8 : 0;

		describe("COPY", function() {
			describe("--from", function() {
				it("ok", function() {
					let signatureHelp = compute(onbuild + "COPY --from=", 0, triggerOffset + 12);
					assertCopy_FlagFrom(signatureHelp);

					signatureHelp = compute(onbuild + "COPY --from= app app", 0, triggerOffset + 12);
					assertCopy_FlagFrom(signatureHelp);

					signatureHelp = compute(onbuild + "COPY --from=s app app", 0, triggerOffset + 13);
					assertCopy_FlagFrom(signatureHelp);
				});
	
				it("invalid", function() {
					let signatureHelp = compute(onbuild + "COPY --from= ", 0, triggerOffset + 13);
					assertNoSignatures(signatureHelp);

					signatureHelp = compute(onbuild + "COPY app --from= app ", 0, triggerOffset + 16);
					assertNoSignatures(signatureHelp);
					
					signatureHelp = compute(onbuild + "COPY app app --from=", 0, triggerOffset + 20);
					assertNoSignatures(signatureHelp);
				});
			});
		});
	}

	testCopy(false);

	function testHealthcheck(trigger: boolean) {
		let onbuild = trigger ? "ONBUILD " : "";
		let triggerOffset = trigger ? 8 : 0;

		describe("HEALTHCHECK", function() {
			describe("--interval", function() {
				it("ok", function() {
					let signatureHelp = compute(onbuild + "HEALTHCHECK --interval=", 0, triggerOffset + 23);
					assertHealthcheck_FlagInterval(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --interval=1", 0, triggerOffset + 24);
					assertHealthcheck_FlagInterval(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --interval=30s --interval=", 0, triggerOffset + 38);
					assertHealthcheck_FlagInterval(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --retries=3 --interval=", 0, triggerOffset + 35);
					assertHealthcheck_FlagInterval(signatureHelp);
				});
	
				it("invalid", function() {
					let signatureHelp = compute(onbuild + "HEALTHCHECK CMD --interval=", 0, triggerOffset + 37);
					assertNoSignatures(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK NONE --interval=", 0, triggerOffset + 38);
					assertNoSignatures(signatureHelp);
				});
			});

			describe("--retries", function() {
				it("ok", function() {
					let signatureHelp = compute(onbuild + "HEALTHCHECK --retries=", 0, triggerOffset + 22);
					assertHealthcheck_FlagRetries(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --retries=1", 0, triggerOffset + 23);
					assertHealthcheck_FlagRetries(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --retries=30s --retries=", 0, triggerOffset + 36);
					assertHealthcheck_FlagRetries(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --interval=30s --retries=", 0, triggerOffset + 37);
					assertHealthcheck_FlagRetries(signatureHelp);
				});
	
				it("invalid", function() {
					let signatureHelp = compute(onbuild + "HEALTHCHECK CMD --retries=", 0, triggerOffset + 36);
					assertNoSignatures(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK NONE --retries=", 0, triggerOffset + 37);
					assertNoSignatures(signatureHelp);
				});
			});

			describe("--start-period", function() {
				it("ok", function() {
					let signatureHelp = compute(onbuild + "HEALTHCHECK --start-period=", 0, triggerOffset + 27);
					assertHealthcheck_FlagStartPeriod(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --start-period=1", 0, triggerOffset + 28);
					assertHealthcheck_FlagStartPeriod(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --start-period=30s --start-period=", 0, triggerOffset + 46);
					assertHealthcheck_FlagStartPeriod(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --retries=3 --start-period=", 0, triggerOffset + 39);
					assertHealthcheck_FlagStartPeriod(signatureHelp);
				});
	
				it("invalid", function() {
					let signatureHelp = compute(onbuild + "HEALTHCHECK CMD --start-period=", 0, triggerOffset + 41);
					assertNoSignatures(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK NONE --start-period=", 0, triggerOffset + 42);
					assertNoSignatures(signatureHelp);
				});
			});

			describe("--timeout", function() {
				it("ok", function() {
					let signatureHelp = compute(onbuild + "HEALTHCHECK --timeout=", 0, triggerOffset + 22);
					assertHealthcheck_FlagTimeout(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --timeout=1", 0, triggerOffset + 23);
					assertHealthcheck_FlagTimeout(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --timeout=30s --timeout=", 0, triggerOffset + 36);
					assertHealthcheck_FlagTimeout(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK --retries=3 --timeout=", 0, triggerOffset + 34);
					assertHealthcheck_FlagTimeout(signatureHelp);
				});
	
				it("invalid", function() {
					let signatureHelp = compute(onbuild + "HEALTHCHECK CMD --timeout=", 0, triggerOffset + 36);
					assertNoSignatures(signatureHelp);

					signatureHelp = compute(onbuild + "HEALTHCHECK NONE --timeout=", 0, triggerOffset + 37);
					assertNoSignatures(signatureHelp);
				});
			});
		});
	}

	testHealthcheck(false);

	describe("ONBUILD", function() {
		testCopy(true);
		testHealthcheck(true);
	});
});
