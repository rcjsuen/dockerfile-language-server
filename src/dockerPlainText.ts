/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

export class PlainTextDocumentation {

	private dockerMessages = {
		"hoverAdd": "Copy files, folders, or remote URLs from `source` to the `dest` path in the image's filesystem.\n\n",
		"hoverArg": "Define a variable with an optional default value that users can override at build-time when using `docker build`.\n\n",
		"hoverCmd": "Provide defaults for an executing container. If an executable is not specified, then ENTRYPOINT must be specified as well. There can only be one CMD instruction in a Dockerfile.\n\n",
		"hoverCopy": "Copy files or folders from `source` to the `dest` path in the image's filesystem.\n\n",
		"hoverEntrypoint": "Configures the container to be run as an executable.\n\n",
		"hoverEnv": "Set the environment variable `key` to the value `value`.\n\n",
		"hoverExpose": "Define the network `port`s that this container will listen on at runtime.\n\n",
		"hoverFrom": "Set the `baseImage` to use for subsequent instructions. FROM must be the first instruction in a Dockerfile.\n\n",
		"hoverHealthcheck": "Define how Docker should test the container to check that it is still working. Alternatively, disable the base image's HEALTHCHECK instruction. There can only be one HEALTHCHECK instruction in a Dockerfile.\n\nSince Docker 1.12\n\n",
		"hoverLabel": "Adds metadata to an image.\n\nSince Docker 1.6\n\n",
		"hoverMaintainer": "Set the Author field of the generated images. This instruction has been deprecated in favor of LABEL.\n\n",
		"hoverOnbuild": "Add a trigger instruction to the image that will be executed when the image is used as a base image for another build.\n\n",
		"hoverRun": "Execute any commands on top of the current image as a new layer and commit the results.\n\n",
		"hoverShell": "Override the default shell used for the shell form of commands.\n\nSince Docker 1.12\n\n",
		"hoverStopsignal": "Set the system call signal to use to send to the container to exit. Signals can be valid unsigned numbers or a signal name in the SIGNAME format such as SIGKILL.\n\nSince Docker 1.12\n\n",
		"hoverUser": "Set the user name or UID to use when running the image in addition to any subsequent CMD, ENTRYPOINT, or RUN instructions that follow it in the Dockerfile.\n\n",
		"hoverVolume": "Create a mount point with the specifid name and mark it as holding externally mounted volumes from the native host or from other containers.\n\n",
		"hoverWorkdir": "Set the working directory for any subsequent ADD, COPY, CMD, ENTRYPOINT, or RUN` instructions that follow it in the `Dockerfile`.\n\n",

		"hoverCopyFlagFrom": "The previous build stage to use as the source location instead of the build's context.\n\nSince Docker 17.05.0-ce.",
		"hoverHealthcheckFlagInterval": "The seconds to wait for the health check to run after the container has started, and then again the number of seconds to wait before running again after the previous check has completed.",
		"hoverHealthcheckFlagRetries": "The number of consecutive failures of this health check before the container is considered to be `unhealthy`.",
		"hoverHealthcheckFlagStartPeriod": "The number of seconds to wait for the container to startup. Failures during this grace period will not count towards the maximum number of retries. However, should a health check succeed during this period then any subsequent failures will count towards the maximum number of retries.\n\nSince Docker 17.05.0-ce.",
		"hoverHealthcheckFlagTimeout": "The number of seconds to wait for the check to complete before considering it to have failed.",

		"hoverEscape": "Sets the character to use to escape characters and newlines in this Dockerfile. If unspecified, the default escape character is `\\`.\n\n",

		"signatureEscape": "Sets this Dockerfile's escape character. If unspecified, the default escape character is `\\`.",
		"signatureEscape_Param": "The character to use to escape characters and newlines in this Dockerfile.",

		"signatureArg_Signature0": "Define a variable that users can pass a value to at build-time with `docker build`.",
		"signatureArg_Signature0_Param": "The name of the variable.",
		"signatureArg_Signature1": "Define a variable with an optional default value that users can override at build-time with `docker build`.",
		"signatureArg_Signature1_Param1": "The default value of the variable.",
		"signatureCopyFlagFrom": "Set the build stage to use as the source location of this copy instruction instead of the build's context.",
		"signatureCopyFlagFrom_Param": "The build stage or image name to use as the source. Also may be a numeric index.",
		"signatureExpose": "Define network ports for this container to listen on at runtime.",
		"signatureExpose_Param0": "The port that this container should listen on.",
		"signatureFrom_Signature0": "Set the base image to use for any subsequent instructions that follow.",
		"signatureFrom_Signature0_Param": "The name of the base image to use.",
		"signatureFrom_Signature1_Param1": "The tag of the base image to use.",
		"signatureFrom_Signature2_Param1": "The digest of the base image to use.",
		"signatureFrom_Signature3": "Set the base image to use for any subsequent instructions that follow and also give this build stage a name.",
		"signatureFrom_Signature3_Param2": "The name of this build stage.",
		"signatureFrom_Param2": "The name of this build stage.",
		"signatureHealthcheck": "Define how Docker should test the container to check that it is still working.",
		"signatureShell": "Override default shell used for the shell form of commands.",
		"signatureShell_Param1": "The shell executable to use.",
		"signatureShell_Param2": "The parameters to the shell executable.",
		"signatureStopsignal": "Set the system call signal to use to send to the container to exit.",
		"signatureStopsignal_Param": "The signal to send to the container to exit. This may be an valid unsigned number or a signal name in the SIGNAME format such as SIGKILL.",
		"signatureUser_Signature0": "Set the user name to use for running any RUN, CMD, and ENTRYPOINT instructions that follow.",
		"signatureUser_Signature0_Param": "The user name to use.",
		"signatureUser_Signature1": "Set the user name and user group to use for running any RUN, CMD, and ENTRYPOINT instructions that follow.",
		"signatureUser_Signature1_Param1": "The group name to use.",
		"signatureUser_Signature2": "Set the UID to use for running any RUN, CMD, and ENTRYPOINT instructions that follow.",
		"signatureUser_Signature2_Param": "The UID to use.",
		"signatureUser_Signature3": "Set the UID and GID to use for running any RUN, CMD, and ENTRYPOINT instructions that follow.",
		"signatureUser_Signature3_Param1": "The GID to use.",
		"signatureWorkdir": "Set the working directory for any ADD, COPY, CMD, ENTRYPOINT, or RUN instructions that follow.",
		"signatureWorkdir_Param": "The absolute or relative path to use as the working directory. Will be created if it does not exist.",

		"proposalArgNameOnly": "Define a variable that users can set at build-time when using `docker build`.\n\n",
		"proposalArgDefaultValue": "Define a variable with the given default value that users can override at build-time when using `docker build`.\n\n",
		"proposalHealthcheckExec": "Define how Docker should test the container to check that it is still working. There can only be one HEALTHCHECK instruction in a Dockerfile.\n\nSince Docker 1.12\n\n",
		"proposalHealthcheckNone": "Disable the HEALTHCHECK instruction inherited from the base image if one exists. There can only be one HEALTHCHECK instruction in a Dockerfile.\n\nSince Docker 1.12"
	};

	private markdowns: any;

	constructor() {
		this.markdowns = {
			ADD: this.dockerMessages["hoverAdd"] +
				"ADD hello.txt /absolute/path\n" +
				"ADD hello.txt relative/to/workdir"
			,

			ARG: this.dockerMessages["hoverArg"] +
				"ARG userName\n" +
				"ARG testOutputDir=test"
			,

			ARG_NameOnly: this.dockerMessages["proposalArgNameOnly"] +
				"ARG userName"
			,

			ARG_DefaultValue: this.dockerMessages["proposalArgDefaultValue"] +
				"ARG testOutputDir=test"
			,

			CMD: this.dockerMessages["hoverCmd"] +
				"CMD [ \"/bin/ls\", \"-l\" ]"
			,

			COPY: this.dockerMessages["hoverCopy"] +
				"COPY hello.txt /absolute/path\n" +
				"COPY hello.txt relative/to/workdir"
			,

			COPY_FlagFrom: this.dockerMessages["hoverCopyFlagFrom"],

			ENTRYPOINT: this.dockerMessages["hoverEntrypoint"] +
				"ENTRYPOINT [ \"/opt/app/run.sh\", \"--port\", \"8080\" ]"
			,

			ENV: this.dockerMessages["hoverEnv"] +
				"ENV buildTag=1.0"
			,

			EXPOSE: this.dockerMessages["hoverExpose"] +
				"EXPOSE 8080\n" +
				"EXPOSE 80 443 22\n" +
				"EXPOSE 7000-8000"
			,

			FROM: this.dockerMessages["hoverFrom"] +
				"FROM baseImage\n" +
				"FROM baseImage:tag\n" +
				"FROM baseImage@digest"
			,

			HEALTHCHECK: this.dockerMessages["hoverHealthcheck"] +
				"HEALTHCHECK --interval=10m --timeout=5s \\\n" +
				"    CMD curl -f http://localhost/ || exit 1\n" +
				"HEALTHCHECK NONE"
			,

			HEALTHCHECK_CMD: this.dockerMessages["proposalHealthcheckExec"] +
				"HEALTHCHECK --interval=10m --timeout=5s \\\n" +
				"    CMD curl -f http://localhost/ || exit 1"
			,

			HEALTHCHECK_FlagInterval: this.dockerMessages["hoverHealthcheckFlagInterval"],

			HEALTHCHECK_FlagRetries: this.dockerMessages["hoverHealthcheckFlagRetries"],

			HEALTHCHECK_FlagStartPeriod: this.dockerMessages["hoverHealthcheckFlagStartPeriod"],

			HEALTHCHECK_FlagTimeout: this.dockerMessages["hoverHealthcheckFlagTimeout"],

			HEALTHCHECK_NONE: this.dockerMessages["proposalHealthcheckNone"],

			LABEL: this.dockerMessages["hoverLabel"] +
				"LABEL version=\"1.0\""
			,

			MAINTAINER: this.dockerMessages["hoverMaintainer"] +
				"MAINTAINER name"
			,

			ONBUILD: this.dockerMessages["hoverOnbuild"] +
				"ONBUILD ADD . /opt/app/src/extensions\n" +
				"ONBUILD RUN /usr/local/bin/build.sh /opt/app"
			,

			RUN: this.dockerMessages["hoverRun"] +
				"RUN apt-get update && apt-get install -y curl"
			,

			SHELL: this.dockerMessages["hoverShell"] +
				"SHELL [ \"powershell\", \"-command\" ]"
			,

			STOPSIGNAL: this.dockerMessages["hoverStopsignal"] +
				"STOPSIGNAL 9"
			,

			USER: this.dockerMessages["hoverUser"] +
				"USER daemon"
			,

			VOLUME: this.dockerMessages["hoverVolume"] +
				"VOLUME [ \"/var/db\" ]"
			,

			WORKDIR: this.dockerMessages["hoverWorkdir"] +
				"WORKDIR /path/to/workdir\n" +
				"WORKDIR relative/path"
			,

			escape: this.dockerMessages["hoverEscape"] +
				"# escape=`",

			signatureEscape: this.dockerMessages["signatureEscape"],
			signatureEscape_Param: this.dockerMessages["signatureEscape_Param"],

			signatureArg_Signature0: this.dockerMessages["signatureArg_Signature0"],
			signatureArg_Signature0_Param: this.dockerMessages["signatureArg_Signature0_Param"],
			signatureArg_Signature1: this.dockerMessages["signatureArg_Signature1"],
			signatureArg_Signature1_Param0: this.dockerMessages["signatureArg_Signature0_Param"],
			signatureArg_Signature1_Param1: this.dockerMessages["signatureArg_Signature1_Param1"],
			signatureCopyFlagFrom: this.dockerMessages["signatureCopyFlagFrom"],
			signatureCopyFlagFrom_Param: this.dockerMessages["signatureCopyFlagFrom_Param"],
			signatureExpose: this.dockerMessages["signatureExpose"],
			signatureExpose_Param0: this.dockerMessages["signatureExpose_Param0"],
			signatureExpose_Param1: this.dockerMessages["signatureExpose_Param0"],
			signatureFrom_Signature0: this.dockerMessages["signatureFrom_Signature0"],
			signatureFrom_Signature0_Param: this.dockerMessages["signatureFrom_Signature0_Param"],
			signatureFrom_Signature1: this.dockerMessages["signatureFrom_Signature0"],
			signatureFrom_Signature1_Param0: this.dockerMessages["signatureFrom_Signature0_Param"],
			signatureFrom_Signature1_Param1: this.dockerMessages["signatureFrom_Signature1_Param1"],
			signatureFrom_Signature2: this.dockerMessages["signatureFrom_Signature0"],
			signatureFrom_Signature2_Param0: this.dockerMessages["signatureFrom_Signature0_Param"],
			signatureFrom_Signature2_Param1: this.dockerMessages["signatureFrom_Signature2_Param1"],
			signatureFrom_Signature3: this.dockerMessages["signatureFrom_Signature3"],
			signatureFrom_Signature3_Param0: this.dockerMessages["signatureFrom_Signature0_Param"],
			signatureFrom_Signature3_Param2: this.dockerMessages["signatureFrom_Signature3_Param2"],
			signatureFrom_Signature4: this.dockerMessages["signatureFrom_Signature3"],
			signatureFrom_Signature4_Param0: this.dockerMessages["signatureFrom_Signature0_Param"],
			signatureFrom_Signature4_Param1: this.dockerMessages["signatureFrom_Signature1_Param1"],
			signatureFrom_Signature4_Param3: this.dockerMessages["signatureFrom_Signature3_Param2"],
			signatureFrom_Signature5: this.dockerMessages["signatureFrom_Signature3"],
			signatureFrom_Signature5_Param0: this.dockerMessages["signatureFrom_Signature0_Param"],
			signatureFrom_Signature5_Param1: this.dockerMessages["signatureFrom_Signature2_Param1"],
			signatureFrom_Signature5_Param3: this.dockerMessages["signatureFrom_Signature3_Param2"],
			signatureHealthcheck: this.dockerMessages["signatureHealthcheck"],
			signatureHealthcheckFlagInterval_Param: this.dockerMessages["hoverHealthcheckFlagInterval"],
			signatureHealthcheckFlagRetries_Param: this.dockerMessages["hoverHealthcheckFlagRetries"],
			signatureHealthcheckFlagStartPeriod_Param: this.dockerMessages["hoverHealthcheckFlagStartPeriod"],
			signatureHealthcheckFlagTimeout_Param: this.dockerMessages["hoverHealthcheckFlagTimeout"],
			signatureShell: this.dockerMessages["signatureShell"],
			signatureShell_Param1: this.dockerMessages["signatureShell_Param1"],
			signatureShell_Param2: this.dockerMessages["signatureShell_Param2"],
			signatureShell_Param3: this.dockerMessages["signatureShell_Param2"],
			signatureStopsignal: this.dockerMessages["signatureStopsignal"],
			signatureStopsignal_Param: this.dockerMessages["signatureStopsignal_Param"],
			signatureUser_Signature0: this.dockerMessages["signatureUser_Signature0"],
			signatureUser_Signature0_Param: this.dockerMessages["signatureUser_Signature0_Param"],
			signatureUser_Signature1: this.dockerMessages["signatureUser_Signature1"],
			signatureUser_Signature1_Param0: this.dockerMessages["signatureUser_Signature0"],
			signatureUser_Signature1_Param1: this.dockerMessages["signatureUser_Signature1_Param1"],
			signatureUser_Signature2: this.dockerMessages["signatureUser_Signature2"],
			signatureUser_Signature2_Param: this.dockerMessages["signatureUser_Signature2_Param"],
			signatureUser_Signature3: this.dockerMessages["signatureUser_Signature3"],
			signatureUser_Signature3_Param0: this.dockerMessages["signatureUser_Signature2_Param"],
			signatureUser_Signature3_Param1: this.dockerMessages["signatureUser_Signature3_Param1"],
			signatureWorkdir: this.dockerMessages["signatureWorkdir"],
			signatureWorkdir_Param: this.dockerMessages["signatureWorkdir_Param"]
		};
	}

	getDocumentation(data: string): string {
		return this.markdowns[data];
	}
}
