/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import {
	TextDocument, Position, Range, SignatureHelp, SignatureInformation
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

function assertArg_Name(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assert.equal(signatureHelp.signatures.length, 2);

	assert.equal(signatureHelp.signatures[0].label, "ARG name");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureArg_Signature0"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 1);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "name");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureArg_Signature0_Param"));

	assert.equal(signatureHelp.signatures[1].label, "ARG name=defaultValue");
	assert.notEqual(signatureHelp.signatures[1].documentation, null);
	assert.equal(signatureHelp.signatures[1].documentation, docs.getDocumentation("signatureArg_Signature1"));
	assert.equal(signatureHelp.signatures[1].parameters.length, 2);
	assert.equal(signatureHelp.signatures[1].parameters[0].label, "name");
	assert.notEqual(signatureHelp.signatures[1].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[1].parameters[0].documentation, docs.getDocumentation("signatureArg_Signature1_Param0"));
	assert.equal(signatureHelp.signatures[1].parameters[1].label, "defaultValue");
	assert.notEqual(signatureHelp.signatures[1].parameters[1].documentation, null);
	assert.equal(signatureHelp.signatures[1].parameters[1].documentation, docs.getDocumentation("signatureArg_Signature1_Param1"));
}

function assertArg_NameDefaultValue(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assert.equal(signatureHelp.signatures[0].label, "ARG name=defaultValue");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureArg_Signature1"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 2);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "name");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureArg_Signature1_Param0"));
	assert.equal(signatureHelp.signatures[0].parameters[1].label, "defaultValue");
	assert.notEqual(signatureHelp.signatures[0].parameters[1].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[1].documentation, docs.getDocumentation("signatureArg_Signature1_Param1"));
}

function assertExpose(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.signatures[0].label, "EXPOSE port ...");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureExpose"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 2);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "port");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureExpose_Param0"));
	assert.equal(signatureHelp.signatures[0].parameters[1].label, "...");
	assert.notEqual(signatureHelp.signatures[0].parameters[1].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[1].documentation, docs.getDocumentation("signatureExpose_Param1"));
}

function assertFrom_Image(signature: SignatureInformation) {
	assert.equal(signature.label, "FROM baseImage");
	assert.notEqual(signature.documentation, null);
	assert.equal(signature.documentation, docs.getDocumentation("signatureFrom_Signature0"));
	assert.equal(signature.parameters.length, 1);
	assert.equal(signature.parameters[0].label, "baseImage");
	assert.notEqual(signature.parameters[0].documentation, null);
	assert.equal(signature.parameters[0].documentation, docs.getDocumentation("signatureFrom_Signature0_Param"));
}

function assertFrom_ImageTag(signature: SignatureInformation) {
	assert.equal(signature.label, "FROM baseImage:tag");
	assert.notEqual(signature.documentation, null);
	assert.equal(signature.documentation, docs.getDocumentation("signatureFrom_Signature1"));
	assert.equal(signature.parameters.length, 2);
	assert.equal(signature.parameters[0].label, "baseImage");
	assert.notEqual(signature.parameters[0].documentation, null);
	assert.equal(signature.parameters[0].documentation, docs.getDocumentation("signatureFrom_Signature1_Param0"));
	assert.equal(signature.parameters[1].label, "tag");
	assert.notEqual(signature.parameters[1].documentation, null);
	assert.equal(signature.parameters[1].documentation, docs.getDocumentation("signatureFrom_Signature1_Param1"));
}

function assertFrom_ImageDigest(signature: SignatureInformation) {
	assert.equal(signature.label, "FROM baseImage@digest");
	assert.notEqual(signature.documentation, null);
	assert.equal(signature.documentation, docs.getDocumentation("signatureFrom_Signature2"));
	assert.equal(signature.parameters.length, 2);
	assert.equal(signature.parameters[0].label, "baseImage");
	assert.notEqual(signature.parameters[0].documentation, null);
	assert.equal(signature.parameters[0].documentation, docs.getDocumentation("signatureFrom_Signature2_Param0"));
	assert.equal(signature.parameters[1].label, "digest");
	assert.notEqual(signature.parameters[1].documentation, null);
	assert.equal(signature.parameters[1].documentation, docs.getDocumentation("signatureFrom_Signature2_Param1"));
}

function assertFrom_Image_BuildStage(signature: SignatureInformation) {
	assert.equal(signature.label, "FROM baseImage AS stage");
	assert.notEqual(signature.documentation, null);
	assert.equal(signature.documentation, docs.getDocumentation("signatureFrom_Signature3"));
	assert.equal(signature.parameters.length, 3);
	assert.equal(signature.parameters[0].label, "baseImage");
	assert.notEqual(signature.parameters[0].documentation, null);
	assert.equal(signature.parameters[0].documentation, docs.getDocumentation("signatureFrom_Signature3_Param0"));
	assert.equal(signature.parameters[1].label, "AS");
	assert.equal(signature.parameters[1].documentation, null);
	assert.equal(signature.parameters[2].label, "stage");
	assert.notEqual(signature.parameters[2].documentation, null);
	assert.equal(signature.parameters[2].documentation, docs.getDocumentation("signatureFrom_Signature3_Param2"));
}

function assertFrom_ImageTag_BuildStage(signature: SignatureInformation) {
	assert.equal(signature.label, "FROM baseImage:tag AS stage");
	assert.notEqual(signature.documentation, null);
	assert.equal(signature.documentation, docs.getDocumentation("signatureFrom_Signature4"));
	assert.equal(signature.parameters.length, 4);
	assert.equal(signature.parameters[0].label, "baseImage");
	assert.notEqual(signature.parameters[0].documentation, null);
	assert.equal(signature.parameters[0].documentation, docs.getDocumentation("signatureFrom_Signature4_Param0"));
	assert.equal(signature.parameters[1].label, "tag");
	assert.notEqual(signature.parameters[1].documentation, null);
	assert.equal(signature.parameters[1].documentation, docs.getDocumentation("signatureFrom_Signature4_Param1"));
	assert.equal(signature.parameters[2].label, "AS");
	assert.equal(signature.parameters[2].documentation, null);
	assert.equal(signature.parameters[3].label, "stage");
	assert.notEqual(signature.parameters[3].documentation, null);
	assert.equal(signature.parameters[3].documentation, docs.getDocumentation("signatureFrom_Signature4_Param3"));
}

function assertFrom_ImageDigest_BuildStage(signature: SignatureInformation) {
	assert.equal(signature.label, "FROM baseImage@digest AS stage");
	assert.notEqual(signature.documentation, null);
	assert.equal(signature.documentation, docs.getDocumentation("signatureFrom_Signature5"));
	assert.equal(signature.parameters.length, 4);
	assert.equal(signature.parameters[0].label, "baseImage");
	assert.notEqual(signature.parameters[0].documentation, null);
	assert.equal(signature.parameters[0].documentation, docs.getDocumentation("signatureFrom_Signature5_Param0"));
	assert.equal(signature.parameters[1].label, "digest");
	assert.notEqual(signature.parameters[1].documentation, null);
	assert.equal(signature.parameters[1].documentation, docs.getDocumentation("signatureFrom_Signature5_Param1"));
	assert.equal(signature.parameters[2].label, "AS");
	assert.equal(signature.parameters[2].documentation, null);
	assert.equal(signature.parameters[3].label, "stage");
	assert.notEqual(signature.parameters[3].documentation, null);
	assert.equal(signature.parameters[3].documentation, docs.getDocumentation("signatureFrom_Signature5_Param3"));
}

function assertFrom(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.signatures.length, 6);
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assertFrom_Image(signatureHelp.signatures[0]);
	assertFrom_ImageTag(signatureHelp.signatures[1]);
	assertFrom_ImageDigest(signatureHelp.signatures[2]);
	assertFrom_Image_BuildStage(signatureHelp.signatures[3]);
	assertFrom_ImageTag_BuildStage(signatureHelp.signatures[4]);
	assertFrom_ImageDigest_BuildStage(signatureHelp.signatures[5]);
}

function assertFrom_Tags(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.signatures.length, 2);
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assertFrom_ImageTag(signatureHelp.signatures[0]);
	assertFrom_ImageTag_BuildStage(signatureHelp.signatures[1]);
}

function assertFrom_Digests(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.signatures.length, 2);
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assertFrom_ImageDigest(signatureHelp.signatures[0]);
	assertFrom_ImageDigest_BuildStage(signatureHelp.signatures[1]);
}

function assertFrom_BuildStages(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.signatures.length, 3);
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assertFrom_Image_BuildStage(signatureHelp.signatures[0]);
	assertFrom_ImageTag_BuildStage(signatureHelp.signatures[1]);
	assertFrom_ImageDigest_BuildStage(signatureHelp.signatures[2]);
}

function assertFrom_Tags_BuildStages_Only(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assertFrom_ImageTag_BuildStage(signatureHelp.signatures[0]);
}

function assertFrom_Digests_BuildStages_Only(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assertFrom_ImageDigest_BuildStage(signatureHelp.signatures[0]);
}

function assertLabel_Space(signature: SignatureInformation) {
	assert.equal(signature.label, "LABEL key value");
	assert.notEqual(signature.documentation, null);
	assert.equal(signature.documentation, docs.getDocumentation("signatureLabel_Signature0"));
	assert.equal(signature.parameters.length, 2);
	assert.equal(signature.parameters[0].label, "key");
	assert.notEqual(signature.parameters[0].documentation, null);
	assert.equal(signature.parameters[0].documentation, docs.getDocumentation("signatureLabel_Signature0_Param0"));
	assert.equal(signature.parameters[1].label, "value");
	assert.notEqual(signature.parameters[1].documentation, null);
	assert.equal(signature.parameters[1].documentation, docs.getDocumentation("signatureLabel_Signature0_Param1"));
}

function assertLabel_EqualsSingle(signature: SignatureInformation) {
	assert.equal(signature.label, "LABEL key=value");
	assert.notEqual(signature.documentation, null);
	assert.equal(signature.documentation, docs.getDocumentation("signatureLabel_Signature1"));
	assert.equal(signature.parameters.length, 2);
	assert.equal(signature.parameters[0].label, "key");
	assert.notEqual(signature.parameters[0].documentation, null);
	assert.equal(signature.parameters[0].documentation, docs.getDocumentation("signatureLabel_Signature1_Param0"));
	assert.equal(signature.parameters[1].label, "value");
	assert.notEqual(signature.parameters[1].documentation, null);
	assert.equal(signature.parameters[1].documentation, docs.getDocumentation("signatureLabel_Signature1_Param1"));
}

function assertLabel_EqualsMulti(signature: SignatureInformation) {
	assert.equal(signature.label, "LABEL key=value key2=value2");
	assert.notEqual(signature.documentation, null);
	assert.equal(signature.documentation, docs.getDocumentation("signatureLabel_Signature2"));
	assert.equal(signature.parameters.length, 4);
	assert.equal(signature.parameters[0].label, "key");
	assert.notEqual(signature.parameters[0].documentation, null);
	assert.equal(signature.parameters[0].documentation, docs.getDocumentation("signatureLabel_Signature2_Param0"));
	assert.equal(signature.parameters[1].label, "value");
	assert.notEqual(signature.parameters[1].documentation, null);
	assert.equal(signature.parameters[1].documentation, docs.getDocumentation("signatureLabel_Signature2_Param1"));
	assert.equal(signature.parameters[2].label, "key2");
	assert.notEqual(signature.parameters[2].documentation, null);
	assert.equal(signature.parameters[2].documentation, docs.getDocumentation("signatureLabel_Signature2_Param2"));
	assert.equal(signature.parameters[3].label, "value2");
	assert.notEqual(signature.parameters[3].documentation, null);
	assert.equal(signature.parameters[3].documentation, docs.getDocumentation("signatureLabel_Signature2_Param3"));
}

function assertLabel(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.signatures.length, 3);
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assertLabel_Space(signatureHelp.signatures[0]);
	assertLabel_EqualsSingle(signatureHelp.signatures[1]);
	assertLabel_EqualsMulti(signatureHelp.signatures[2]);
}

function assertLabel_SpaceOnly(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assertLabel_Space(signatureHelp.signatures[0]);
}

function assertLabel_Equals(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.signatures.length, 2);
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assertLabel_EqualsSingle(signatureHelp.signatures[0]);
	assertLabel_EqualsMulti(signatureHelp.signatures[1]);
}

function assertLabel_EqualsMultiOnly(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assertLabel_EqualsMulti(signatureHelp.signatures[0]);
}

function assertOnbuild(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.signatures[0].label, "ONBUILD INSTRUCTION");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureOnbuild"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 1);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "INSTRUCTION");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureOnbuild_Param"));
}

function assertShell(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.signatures[0].label, "SHELL [ \"executable\", \"parameter\", ... ]");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureShell"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 5);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "[");
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[1].label, "\"executable\"");
	assert.notEqual(signatureHelp.signatures[0].parameters[1].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[1].documentation, docs.getDocumentation("signatureShell_Param1"));
	assert.equal(signatureHelp.signatures[0].parameters[2].label, "\"parameter\"");
	assert.notEqual(signatureHelp.signatures[0].parameters[2].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[2].documentation, docs.getDocumentation("signatureShell_Param2"));
	assert.equal(signatureHelp.signatures[0].parameters[3].label, "...");
	assert.notEqual(signatureHelp.signatures[0].parameters[3].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[3].documentation, docs.getDocumentation("signatureShell_Param3"));
	assert.equal(signatureHelp.signatures[0].parameters[4].label, "]");
	assert.equal(signatureHelp.signatures[0].parameters[4].documentation, null);
}

function assertStopsignal(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.signatures[0].label, "STOPSIGNAL signal");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureStopsignal"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 1);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "signal");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureStopsignal_Param"));
}

function assertUser_All(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assert.equal(signatureHelp.signatures.length, 4);

	assert.equal(signatureHelp.signatures[0].label, "USER user");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureUser_Signature0"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 1);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "user");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureUser_Signature0_Param"));

	assert.equal(signatureHelp.signatures[1].label, "USER user:group");
	assert.notEqual(signatureHelp.signatures[1].documentation, null);
	assert.equal(signatureHelp.signatures[1].documentation, docs.getDocumentation("signatureUser_Signature1"));
	assert.equal(signatureHelp.signatures[1].parameters.length, 2);
	assert.equal(signatureHelp.signatures[1].parameters[0].label, "user");
	assert.notEqual(signatureHelp.signatures[1].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[1].parameters[0].documentation, docs.getDocumentation("signatureUser_Signature1_Param0"));
	assert.equal(signatureHelp.signatures[1].parameters[1].label, "group");
	assert.notEqual(signatureHelp.signatures[1].parameters[1].documentation, null);
	assert.equal(signatureHelp.signatures[1].parameters[1].documentation, docs.getDocumentation("signatureUser_Signature1_Param1"));

	assert.equal(signatureHelp.signatures[2].label, "USER uid");
	assert.notEqual(signatureHelp.signatures[2].documentation, null);
	assert.equal(signatureHelp.signatures[2].documentation, docs.getDocumentation("signatureUser_Signature2"));
	assert.equal(signatureHelp.signatures[2].parameters.length, 1);
	assert.equal(signatureHelp.signatures[2].parameters[0].label, "uid");
	assert.notEqual(signatureHelp.signatures[2].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[2].parameters[0].documentation, docs.getDocumentation("signatureUser_Signature2_Param"));

	assert.equal(signatureHelp.signatures[3].label, "USER uid:gid");
	assert.notEqual(signatureHelp.signatures[3].documentation, null);
	assert.equal(signatureHelp.signatures[3].documentation, docs.getDocumentation("signatureUser_Signature3"));
	assert.equal(signatureHelp.signatures[3].parameters.length, 2);
	assert.equal(signatureHelp.signatures[3].parameters[0].label, "uid");
	assert.notEqual(signatureHelp.signatures[3].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[3].parameters[0].documentation, docs.getDocumentation("signatureUser_Signature3_Param0"));
	assert.equal(signatureHelp.signatures[3].parameters[1].label, "gid");
	assert.notEqual(signatureHelp.signatures[3].parameters[1].documentation, null);
	assert.equal(signatureHelp.signatures[3].parameters[1].documentation, docs.getDocumentation("signatureUser_Signature3_Param1"));
}

function assertUser_GroupsOnly(signatureHelp: SignatureHelp, activeParameter: number) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, activeParameter);
	assert.equal(signatureHelp.signatures.length, 2);

	assert.equal(signatureHelp.signatures[0].label, "USER user:group");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureUser_Signature1"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 2);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "user");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureUser_Signature1_Param0"));
	assert.equal(signatureHelp.signatures[0].parameters[1].label, "group");
	assert.notEqual(signatureHelp.signatures[0].parameters[1].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[1].documentation, docs.getDocumentation("signatureUser_Signature1_Param1"));

	assert.equal(signatureHelp.signatures[1].label, "USER uid:gid");
	assert.notEqual(signatureHelp.signatures[1].documentation, null);
	assert.equal(signatureHelp.signatures[1].documentation, docs.getDocumentation("signatureUser_Signature3"));
	assert.equal(signatureHelp.signatures[1].parameters.length, 2);
	assert.equal(signatureHelp.signatures[1].parameters[0].label, "uid");
	assert.notEqual(signatureHelp.signatures[1].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[1].parameters[0].documentation, docs.getDocumentation("signatureUser_Signature3_Param0"));
	assert.equal(signatureHelp.signatures[1].parameters[1].label, "gid");
	assert.notEqual(signatureHelp.signatures[1].parameters[1].documentation, null);
	assert.equal(signatureHelp.signatures[1].parameters[1].documentation, docs.getDocumentation("signatureUser_Signature3_Param1"));
}

function assertWorkdir(signatureHelp: SignatureHelp) {
	assert.equal(signatureHelp.activeSignature, 0);
	assert.equal(signatureHelp.activeParameter, 0);
	assert.equal(signatureHelp.signatures.length, 1);
	assert.equal(signatureHelp.signatures[0].label, "WORKDIR /the/workdir/path");
	assert.notEqual(signatureHelp.signatures[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].documentation, docs.getDocumentation("signatureWorkdir"));
	assert.equal(signatureHelp.signatures[0].parameters.length, 1);
	assert.equal(signatureHelp.signatures[0].parameters[0].label, "/the/workdir/path");
	assert.notEqual(signatureHelp.signatures[0].parameters[0].documentation, null);
	assert.equal(signatureHelp.signatures[0].parameters[0].documentation, docs.getDocumentation("signatureWorkdir_Param"));
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

	function testArg(trigger: boolean) {
		let onbuild = trigger ? "ONBUILD " : "";
		let triggerOffset = trigger ? 8 : 0;

		describe("ARG", function() {
			it("name", function() {
				let signatureHelp = compute(onbuild + "ARG ", 0, triggerOffset + 4);
				assertArg_Name(signatureHelp);

				signatureHelp = compute(onbuild + "ARG name", 0, triggerOffset + 6);
				assertArg_Name(signatureHelp);

				signatureHelp = compute(onbuild + "ARG name", 0, triggerOffset + 8);
				assertArg_Name(signatureHelp);
			});

			it("name=defaultValue", function() {
				let signatureHelp = compute(onbuild + "ARG name=", 0, triggerOffset + 4);
				assertArg_NameDefaultValue(signatureHelp, 0);

				signatureHelp = compute(onbuild + "ARG name=", 0, triggerOffset + 6);
				assertArg_NameDefaultValue(signatureHelp, 0);

				signatureHelp = compute(onbuild + "ARG name=", 0, triggerOffset + 8);
				assertArg_NameDefaultValue(signatureHelp, 0);

				signatureHelp = compute(onbuild + "ARG name=value", 0, triggerOffset + 4);
				assertArg_NameDefaultValue(signatureHelp, 0);
				
				signatureHelp = compute(onbuild + "ARG name=value", 0, triggerOffset + 6);
				assertArg_NameDefaultValue(signatureHelp, 0);

				signatureHelp = compute(onbuild + "ARG name=value", 0, triggerOffset + 8);
				assertArg_NameDefaultValue(signatureHelp, 0);

				signatureHelp = compute(onbuild + "ARG name=value", 0, triggerOffset + 9);
				assertArg_NameDefaultValue(signatureHelp, 1);

				signatureHelp = compute(onbuild + "ARG name=value", 0, triggerOffset + 12);
				assertArg_NameDefaultValue(signatureHelp, 1);

				signatureHelp = compute(onbuild + "ARG name=value ", 0, triggerOffset + 15);
				assertArg_NameDefaultValue(signatureHelp, 1);

				signatureHelp = compute(onbuild + "ARG name=value space", 0, triggerOffset + 16);
				assertArg_NameDefaultValue(signatureHelp, 1);
			});

			it("invalid", function() {
				let signatureHelp = compute(onbuild + "ARG ", 0, triggerOffset + 1);
				if (trigger) {
					assertOnbuild(signatureHelp);
				} else {
					assertNoSignatures(signatureHelp);
				}

				signatureHelp = compute(onbuild + "ARG ", 0, triggerOffset + 3);
				if (trigger) {
					assertOnbuild(signatureHelp);
				} else {
					assertNoSignatures(signatureHelp);
				}
			});
		});
	}

	testArg(false);

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

	function testExpose(trigger: boolean) {
		let onbuild = trigger ? "ONBUILD " : "";
		let triggerOffset = trigger ? 8 : 0;

		describe("EXPOSE", function() {
			it("port", function() {
				let signatureHelp = compute(onbuild + "EXPOSE ", 0, triggerOffset + 7);
				assertExpose(signatureHelp, 0);

				signatureHelp = compute(onbuild + "EXPOSE 8080", 0, triggerOffset + 7);
				assertExpose(signatureHelp, 0);

				signatureHelp = compute(onbuild + "EXPOSE 8080", 0, triggerOffset + 9);
				assertExpose(signatureHelp, 0);

				signatureHelp = compute(onbuild + "EXPOSE 8080 ", 0, triggerOffset + 11);
				assertExpose(signatureHelp, 0);
			});

			it("...", function() {
				let signatureHelp = compute(onbuild + "EXPOSE 8080 ", 0, triggerOffset + 12);
				assertExpose(signatureHelp, 1);

				signatureHelp = compute(onbuild + "EXPOSE 8080 8081", 0, triggerOffset + 12);
				assertExpose(signatureHelp, 1);

				signatureHelp = compute(onbuild + "EXPOSE 8080 8081", 0, triggerOffset + 14);
				assertExpose(signatureHelp, 1);

				signatureHelp = compute(onbuild + "EXPOSE 8080 8081", 0, triggerOffset + 14);
				assertExpose(signatureHelp, 1);

				signatureHelp = compute(onbuild + "EXPOSE 8080 8081", 0, triggerOffset + 16);
				assertExpose(signatureHelp, 1);

				signatureHelp = compute(onbuild + "EXPOSE 8080 8081 ", 0, triggerOffset + 16);
				assertExpose(signatureHelp, 1);

				signatureHelp = compute(onbuild + "EXPOSE 8080 8081 8082", 0, triggerOffset + 18);
				assertExpose(signatureHelp, 1);
			});

			it("invalid", function() {
				let signatureHelp = compute(onbuild + "EXPOSE 8080", 0, triggerOffset + 0);
				if (trigger) {
					assertOnbuild(signatureHelp);
				} else {
					assertNoSignatures(signatureHelp);
				}

				signatureHelp = compute(onbuild + "EXPOSE 8080", 0, triggerOffset + 3);
				if (trigger) {
					assertOnbuild(signatureHelp);
				} else {
					assertNoSignatures(signatureHelp);
				}

				signatureHelp = compute(onbuild + "EXPOSE 8080", 0, triggerOffset + 6);
				if (trigger) {
					assertOnbuild(signatureHelp);
				} else {
					assertNoSignatures(signatureHelp);
				}
			});
		});
	}

	testExpose(false);

	describe("FROM", function() {
		it("all", function() {
			assertFrom(compute("FROM ", 0, 5));
			assertFrom(compute("FROM node", 0, 7));
			assertFrom(compute("FROM node", 0, 9));
			assertFrom(compute("FROM  node", 0, 5));
		});

		it("tags", function() {
			assertFrom_Tags(compute("FROM node:", 0, 7), 0);
			assertFrom_Tags(compute("FROM node:", 0, 10), 1);
			assertFrom_Tags(compute("FROM node:latest", 0, 12), 1);
			assertFrom_Tags(compute("FROM node:latest", 0, 16), 1);
		});

		it("digests", function() {
			assertFrom_Digests(compute("FROM node@", 0, 7), 0);
			assertFrom_Digests(compute("FROM node@", 0, 10), 1);
			assertFrom_Digests(compute("FROM node@sha256:613685c22f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700", 0, 12), 1);
			assertFrom_Digests(compute("FROM node@sha256:613685c22f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700", 0, 16), 1);
			assertFrom_Digests(compute("FROM node@sha256:613685c22f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700", 0, 17), 1);
			assertFrom_Digests(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700", 0, 20), 1);
			assertFrom_Digests(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700", 0, 80), 1);
		});

		it("stages", function() {
			assertFrom_BuildStages(compute("FROM node ", 0, 10), 1);

			assertFrom_BuildStages(compute("FROM node AS", 0, 5), 0);
			assertFrom_BuildStages(compute("FROM node AS", 0, 7), 0);
			assertFrom_BuildStages(compute("FROM node AS", 0, 9), 0);
			assertFrom_BuildStages(compute("FROM node AS", 0, 10), 1);
			assertFrom_BuildStages(compute("FROM node AS", 0, 11), 1);
			assertFrom_BuildStages(compute("FROM node AS", 0, 12), 1);

			assertFrom_BuildStages(compute("FROM node AS ", 0, 13), 2);

			assertFrom_BuildStages(compute("FROM node AS js", 0, 5), 0);
			assertFrom_BuildStages(compute("FROM node AS js", 0, 7), 0);
			assertFrom_BuildStages(compute("FROM node AS js", 0, 9), 0);
			assertFrom_BuildStages(compute("FROM node AS js", 0, 10), 1);
			assertFrom_BuildStages(compute("FROM node AS js", 0, 11), 1);
			assertFrom_BuildStages(compute("FROM node AS js", 0, 12), 1);
			assertFrom_BuildStages(compute("FROM node AS js", 0, 13), 2);
			assertFrom_BuildStages(compute("FROM node AS js", 0, 14), 2);
			assertFrom_BuildStages(compute("FROM node AS js", 0, 15), 2);
		});

		it("tags and stages", function() {
			assertFrom_Tags_BuildStages_Only(compute("FROM node: ", 0, 11), 2);

			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS", 0, 5), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS", 0, 7), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS", 0, 9), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS", 0, 10), 1);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS", 0, 11), 2);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS", 0, 12), 2);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS", 0, 13), 2);

			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS ", 0, 14), 3);

			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS js", 0, 5), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS js", 0, 7), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS js", 0, 9), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS js", 0, 10), 1);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS js", 0, 11), 2);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS js", 0, 12), 2);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS js", 0, 13), 2);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS js", 0, 14), 3);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS js", 0, 15), 3);
			assertFrom_Tags_BuildStages_Only(compute("FROM node: AS js", 0, 16), 3);

			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS", 0, 5), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS", 0, 7), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS", 0, 9), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS", 0, 10), 1);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS", 0, 13), 1);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS", 0, 16), 1);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS", 0, 17), 2);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS", 0, 18), 2);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS", 0, 19), 2);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS ", 0, 20), 3);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 5), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 7), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 9), 0);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 10), 1);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 13), 1);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 16), 1);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 17), 2);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 18), 2);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 19), 2);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 20), 3);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 21), 3);
			assertFrom_Tags_BuildStages_Only(compute("FROM node:latest AS js", 0, 22), 3);
		});

		it("digests and stages", function() {
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ ", 0, 11), 2);

			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS", 0, 5), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS", 0, 7), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS", 0, 9), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS", 0, 10), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS", 0, 11), 2);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS", 0, 12), 2);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS", 0, 13), 2);

			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS ", 0, 14), 3);

			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS js", 0, 5), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS js", 0, 7), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS js", 0, 9), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS js", 0, 10), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS js", 0, 11), 2);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS js", 0, 12), 2);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS js", 0, 13), 2);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS js", 0, 14), 3);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS js", 0, 15), 3);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@ AS js", 0, 16), 3);

			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 5), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 7), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 9), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 10), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 13), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 16), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 17), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 35), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 80), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 81), 2);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 82), 2);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS", 0, 83), 2);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS ", 0, 84), 3);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 5), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 7), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 9), 0);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 10), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 13), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 16), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 17), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 35), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 80), 1);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 81), 2);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 82), 2);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 83), 2);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 84), 3);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 85), 3);
			assertFrom_Digests_BuildStages_Only(compute("FROM node@sha256:61368522f65d01f2264bdd49b8a336488e14faf29f3ff9b6bf76a4da23c4700 AS js", 0, 86), 3);
		});

		it("invalid", function() {
			assertNoSignatures(compute("FROM node AS js ", 0, 16));
		});
	});

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

	function testLabel(trigger: boolean) {
		let onbuild = trigger ? "ONBUILD " : "";
		let triggerOffset = trigger ? 8 : 0;

		describe("LABEL", function() {
			it("all", function() {
				assertLabel(compute(onbuild + "LABEL ", 0, triggerOffset + 6));

				assertLabel(compute(onbuild + "LABEL key", 0, triggerOffset + 6));
				assertLabel(compute(onbuild + "LABEL key", 0, triggerOffset + 7));
				assertLabel(compute(onbuild + "LABEL key", 0, triggerOffset + 9));

				assertLabel(compute(onbuild + "LABEL  key", 0, triggerOffset + 6));

				assertLabel(compute(onbuild + "LABEL key ", 0, triggerOffset + 6));
				assertLabel(compute(onbuild + "LABEL key ", 0, triggerOffset + 9));
			});

			it("space", function() {
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key ", 0, triggerOffset + 10), 1);

				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value", 0, triggerOffset + 6), 0);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value", 0, triggerOffset + 9), 0);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value", 0, triggerOffset + 10), 1);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value", 0, triggerOffset + 12), 1);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value", 0, triggerOffset + 15), 1);

				assertLabel_SpaceOnly(compute(onbuild + "LABEL key =value", 0, triggerOffset + 6), 0);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key =value", 0, triggerOffset + 9), 0);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key =value", 0, triggerOffset + 10), 1);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key =value", 0, triggerOffset + 11), 1);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key =value", 0, triggerOffset + 13), 1);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key =value", 0, triggerOffset + 16), 1);

				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value ", 0, triggerOffset + 16), 1);

				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value spaced", 0, triggerOffset + 6), 0);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value spaced", 0, triggerOffset + 9), 0);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value spaced", 0, triggerOffset + 10), 1);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value spaced", 0, triggerOffset + 12), 1);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value spaced", 0, triggerOffset + 15), 1);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value spaced", 0, triggerOffset + 16), 1);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value spaced", 0, triggerOffset + 18), 1);
				assertLabel_SpaceOnly(compute(onbuild + "LABEL key value spaced", 0, triggerOffset + 22), 1);
			});

			it("equals", function() {
				assertLabel_Equals(compute(onbuild + "LABEL key=", 0, triggerOffset + 6), 0);
				assertLabel_Equals(compute(onbuild + "LABEL key=", 0, triggerOffset + 7), 0);
				assertLabel_Equals(compute(onbuild + "LABEL key=", 0, triggerOffset + 9), 0);
				assertLabel_Equals(compute(onbuild + "LABEL key=", 0, triggerOffset + 10), 1);

				assertLabel_Equals(compute(onbuild + "LABEL key=value", 0, triggerOffset + 6), 0);
				assertLabel_Equals(compute(onbuild + "LABEL key=value", 0, triggerOffset + 9), 0);
				assertLabel_Equals(compute(onbuild + "LABEL key=value", 0, triggerOffset + 10), 1);
				assertLabel_Equals(compute(onbuild + "LABEL key=value", 0, triggerOffset + 12), 1);
				assertLabel_Equals(compute(onbuild + "LABEL key=value", 0, triggerOffset + 15), 1);
			});

			it("equals multiples", function() {
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value ", 0, triggerOffset + 16), 2);

				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2", 0, triggerOffset + 6), 0);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2", 0, triggerOffset + 9), 0);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2", 0, triggerOffset + 10), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2", 0, triggerOffset + 12), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2", 0, triggerOffset + 15), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2", 0, triggerOffset + 16), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2", 0, triggerOffset + 18), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2", 0, triggerOffset + 20), 2);

				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=", 0, triggerOffset + 6), 0);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=", 0, triggerOffset + 9), 0);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=", 0, triggerOffset + 10), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=", 0, triggerOffset + 12), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=", 0, triggerOffset + 15), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=", 0, triggerOffset + 16), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=", 0, triggerOffset + 18), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=", 0, triggerOffset + 20), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=", 0, triggerOffset + 21), 3);

				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2", 0, triggerOffset + 6), 0);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2", 0, triggerOffset + 9), 0);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2", 0, triggerOffset + 10), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2", 0, triggerOffset + 12), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2", 0, triggerOffset + 15), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2", 0, triggerOffset + 16), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2", 0, triggerOffset + 18), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2", 0, triggerOffset + 20), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2", 0, triggerOffset + 21), 3);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2", 0, triggerOffset + 24), 3);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2", 0, triggerOffset + 27), 3);

				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 ", 0, triggerOffset + 28), 2);

				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 6), 0);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 9), 0);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 10), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 12), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 15), 1);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 16), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 18), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 20), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 21), 3);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 24), 3);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 27), 3);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 28), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 30), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 32), 2);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 33), 3);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 36), 3);
				assertLabel_EqualsMultiOnly(compute(onbuild + "LABEL key=value key2=value2 key3=value3", 0, triggerOffset + 39), 3);
			});
		});
	}

	testLabel(false);

	describe("ONBUILD", function() {
		it("trigger instruction", function() {
			assertOnbuild(compute("ONBUILD ", 0, 8));

			assertOnbuild(compute("ONBUILD  ", 0, 8));
			assertOnbuild(compute("ONBUILD  ", 0, 9));

			assertOnbuild(compute("ONBUILD TRIGGER", 0, 8));
			assertOnbuild(compute("ONBUILD TRIGGER", 0, 12));
			assertOnbuild(compute("ONBUILD TRIGGER", 0, 15));

			assertNoSignatures(compute("ONBUILD TRIGGER ", 0, 16));

			assertNoSignatures(compute("ONBUILD TRIGGER argument", 0, 16));
			assertNoSignatures(compute("ONBUILD TRIGGER argument", 0, 20));
			assertNoSignatures(compute("ONBUILD TRIGGER argument", 0, 24));
		});
	});

	function testShell(trigger: boolean) {
		let onbuild = trigger ? "ONBUILD " : "";
		let triggerOffset = trigger ? 8 : 0;

		describe("SHELL", function() {
			it("[", function() {
				let signatureHelp = compute(onbuild + "SHELL ", 0, triggerOffset + 6);
				assertShell(signatureHelp, 0);

				signatureHelp = compute(onbuild + "SHELL  ", 0, triggerOffset + 7);
				assertShell(signatureHelp, 0);
			});

			it("executable", function() {
				let signatureHelp = compute(onbuild + "SHELL [", 0, triggerOffset + 7);
				assertShell(signatureHelp, 1);

				signatureHelp = compute(onbuild + "SHELL [\"", 0, triggerOffset + 8);
				assertShell(signatureHelp, 1);

				signatureHelp = compute(onbuild + "SHELL [ ", 0, triggerOffset + 8);
				assertShell(signatureHelp, 1);

				signatureHelp = compute(onbuild + "SHELL [ \"", 0, triggerOffset + 9);
				assertShell(signatureHelp, 1);

				signatureHelp = compute(onbuild + "SHELL [\"cmd\"", 0, triggerOffset + 12);
				assertShell(signatureHelp, 1);

				signatureHelp = compute(onbuild + "SHELL [ \"cmd\"", 0, triggerOffset + 13);
				assertShell(signatureHelp, 1);

				signatureHelp = compute(onbuild + "SHELL [\"cmd\",", 0, triggerOffset + 12);
				assertShell(signatureHelp, 1);

				signatureHelp = compute(onbuild + "SHELL [ \"cmd\",", 0, triggerOffset + 13);
				assertShell(signatureHelp, 1);

				signatureHelp = compute(onbuild + "SHELL []", 0, triggerOffset + 7);
				assertShell(signatureHelp, 1);
			});

			it("parameter", function() {
				let signatureHelp = compute(onbuild + "SHELL [\"cmd\",", 0, triggerOffset + 13);
				assertShell(signatureHelp, 2);

				signatureHelp = compute(onbuild + "SHELL [ \"cmd\",", 0, triggerOffset + 14);
				assertShell(signatureHelp, 2);

				signatureHelp = compute(onbuild + "SHELL [\"cmd\" ,", 0, triggerOffset + 14);
				assertShell(signatureHelp, 2);

				signatureHelp = compute(onbuild + "SHELL [ \"cmd\" ,", 0, triggerOffset + 15);
				assertShell(signatureHelp, 2);

				signatureHelp = compute(onbuild + "SHELL [\"cmd\", ", 0, triggerOffset + 14);
				assertShell(signatureHelp, 2);

				signatureHelp = compute(onbuild + "SHELL [ \"cmd\", ", 0, triggerOffset + 15);
				assertShell(signatureHelp, 2);

				signatureHelp = compute(onbuild + "SHELL [\"cmd\" , ", 0, triggerOffset + 15);
				assertShell(signatureHelp, 2);

				signatureHelp = compute(onbuild + "SHELL [ \"cmd\" , ", 0, triggerOffset + 16);
				assertShell(signatureHelp, 2);

				signatureHelp = compute(onbuild + "SHELL [ \"cmd\" , \"\"", 0, triggerOffset + 18);
				assertShell(signatureHelp, 2);

				signatureHelp = compute(onbuild + "SHELL [ \"cmd\" , \"\",", 0, triggerOffset + 18);
				assertShell(signatureHelp, 2);
			});

			it("...", function() {
				let signatureHelp = compute(onbuild + "SHELL [\"cmd\", \"/C\",", 0, triggerOffset + 19);
				assertShell(signatureHelp, 3);

				signatureHelp = compute(onbuild + "SHELL [\"cmd\", \"/C\", ", 0, triggerOffset + 20);
				assertShell(signatureHelp, 3);

				signatureHelp = compute(onbuild + "SHELL [\"cmd\", \"/C\", \"/C\"]", 0, triggerOffset + 24);
				assertShell(signatureHelp, 3);
			});

			it("]", function() {
				let signatureHelp = compute(onbuild + "SHELL []", 0, triggerOffset + 8);
				assertShell(signatureHelp, 4);

				signatureHelp = compute(onbuild + "SHELL  [ ]", 0, triggerOffset + 10);
				assertShell(signatureHelp, 4);

				signatureHelp = compute(onbuild + "SHELL  [ \"cmd\" ]", 0, triggerOffset + 16);
				assertShell(signatureHelp, 4);
			});

			it("invalid", function() {
				let signatureHelp = compute(onbuild + "SHELL [ \"cmd\" ] ", 0, triggerOffset + 2);
				if (trigger) {
					assertOnbuild(signatureHelp);
				} else {
					assertNoSignatures(signatureHelp);
				}

				signatureHelp = compute(onbuild + "SHELL [] ", 0, triggerOffset + 9);
				assertNoSignatures(signatureHelp);

				signatureHelp = compute(onbuild + "SHELL  [ \"cmd\" ] ", 0, triggerOffset + 17);
				assertNoSignatures(signatureHelp);
			});
		});
	}

	testShell(false);

	function testStopsignal(trigger: boolean) {
		let onbuild = trigger ? "ONBUILD " : "";
		let triggerOffset = trigger ? 8 : 0;

		describe("STOPSIGNAL", function() {
			it("ok", function() {
				let signatureHelp = compute(onbuild + "STOPSIGNAL ", 0, triggerOffset + 11);
				assertStopsignal(signatureHelp);

				signatureHelp = compute(onbuild + "STOPSIGNAL SIGKILL", 0, triggerOffset + 14);
				assertStopsignal(signatureHelp);

				signatureHelp = compute("WORKDIR /path\n" + onbuild + "STOPSIGNAL SIGKILL", 1, triggerOffset + 14);
				assertStopsignal(signatureHelp);
			});

			it("invalid", function() {
				let signatureHelp = compute(onbuild + "STOPSIGNAL SIGKILL", 0, triggerOffset + 5);
				if (trigger) {
					assertOnbuild(signatureHelp);
				} else {
					assertNoSignatures(signatureHelp);
				}
			});
		});
	}

	testStopsignal(false);

	function testUser(trigger: boolean) {
		let onbuild = trigger ? "ONBUILD " : "";
		let triggerOffset = trigger ? 8 : 0;

		describe("USER", function() {
			it("user / uid", function() {
				let signatureHelp = compute(onbuild + "USER ", 0, triggerOffset + 5);
				assertUser_All(signatureHelp);

				signatureHelp = compute(onbuild + "USER user", 0, triggerOffset + 7);
				assertUser_All(signatureHelp);

				signatureHelp = compute(onbuild + "USER user ", 0, triggerOffset + 10);
				assertUser_All(signatureHelp);

				signatureHelp = compute(onbuild + "USER user name", 0, triggerOffset + 12);
				assertUser_All(signatureHelp);
			});

			it("user:group / uid:gid", function() {
				let signatureHelp = compute(onbuild + "USER user:group", 0, triggerOffset + 7);
				assertUser_GroupsOnly(signatureHelp, 0);

				signatureHelp = compute(onbuild + "USER user:group", 0, triggerOffset + 9);
				assertUser_GroupsOnly(signatureHelp, 0);

				signatureHelp = compute(onbuild + "USER user:group", 0, triggerOffset + 10);
				assertUser_GroupsOnly(signatureHelp, 1);

				signatureHelp = compute(onbuild + "USER user:group", 0, triggerOffset + 13);
				assertUser_GroupsOnly(signatureHelp, 1);

				signatureHelp = compute(onbuild + "USER user name:group name", 0, triggerOffset + 12);
				assertUser_GroupsOnly(signatureHelp, 0);

				signatureHelp = compute(onbuild + "USER user name:group name", 0, triggerOffset + 14);
				assertUser_GroupsOnly(signatureHelp, 0);

				signatureHelp = compute(onbuild + "USER user name:group name", 0, triggerOffset + 15);
				assertUser_GroupsOnly(signatureHelp, 1);

				signatureHelp = compute(onbuild + "USER user name:group name", 0, triggerOffset + 18);
				assertUser_GroupsOnly(signatureHelp, 1);
			});

			it("invalid", function() {
				let signatureHelp = compute(onbuild + "USER user", 0, triggerOffset + 2);
				if (trigger) {
					assertOnbuild(signatureHelp);
				} else {
					assertNoSignatures(signatureHelp);
				}
			});
		});
	}

	testUser(false);

	function testWorkdir(trigger: boolean) {
		let onbuild = trigger ? "ONBUILD " : "";
		let triggerOffset = trigger ? 8 : 0;

		describe("WORKDIR", function() {
			it("ok", function() {
				let signatureHelp = compute(onbuild + "WORKDIR ", 0, triggerOffset + 8);
				assertWorkdir(signatureHelp);

				signatureHelp = compute(onbuild + "WORKDIR a b", 0, triggerOffset + 11);
				assertWorkdir(signatureHelp);
			});

			it("invalid", function() {
				let signatureHelp = compute(onbuild + "WORKDIR /path", 0, triggerOffset + 2);
				if (trigger) {
					assertOnbuild(signatureHelp);
				} else {
					assertNoSignatures(signatureHelp);
				}
			});
		});
	}

	testWorkdir(false);

	describe("ONBUILD triggers", function() {
		testArg(true);
		testCopy(true);
		testExpose(true);
		testHealthcheck(true);
		testLabel(true);
		testShell(true);
		testStopsignal(true);
		testUser(true);
		testWorkdir(true);
	});
});
