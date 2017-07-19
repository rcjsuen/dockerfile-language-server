# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- settings
  - docker.languageserver.diagnostics.instructionCmdMultiple? ([#81](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/81))
    - value = ( "ignore" | "warning" | "error" )
    - toggles the diagnostic severity if multiple CMD instructions are found in the Dockerfile
  - docker.languageserver.diagnostics.instructionHealthcheckMultiple? ([#80](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/80))
    - value = ( "ignore" | "warning" | "error" )
    - toggles the diagnostic severity if multiple HEALTHCHECK instructions are found in the Dockerfile
- textDocument/completion
  - suggest build stage names in a COPY instruction ([#44](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/44))
  - add '=' as a trigger character
  - include the --start-period flag in HEALTHCHECK CMD items ([#78](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/78))
  - HEALTHCHECK CMD flags ([#69](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/69))
- textDocument/hover
  - HEALTHCHECK CMD flags ([#82](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/82))
- textDocument/publishDiagnostics
  - check the spelling of instruction flags ([#75](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/75))
    - COPY's from
    - HEALTHCHECK's interval, retries, start-period, timeout
  - multiple instructions found when only one allowed
    - CMD ([#81](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/81))
    - HEALTHCHECK ([#80](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/80))
  - HEALTHCHECK
    - warn if arguments follow a HEALTHCHECK NONE ([#84](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/84))
    - warn if the retries flag doesn't specify a number ([#85](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/85))
    - warn if the retries flag is not a positive intger ([#89](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/89))
- created a CHANGELOG.md file to document the project's changes ([#77](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/77))

### Fixed
- fixed a typo in completion items for WORKDIR ([#76](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/76))

## 0.0.1 - 2017-07-16
### Added
- textDocument/didChange
  - incremental document synchronization
- textDocument/publishDiagnostics
  - instructions not written in uppercase
  - directives not written in lowercase
  - missing or incorrect number of expected of arguments to an instruction
  - invalid escape parser directive value
  - EXPOSE
    - invalid container port
  - FROM
    - no FROM instruction found
    - having a second argument not equal to the AS keyword
  - STOPSIGNAL
    - invalid stop signal definition
- textDocument/codeAction
  - convert instruction to uppercase
  - remove extra argument to instruction
  - convert invalid escape directive to backslash
  - convert invalid escape directive to backtick
  - convert second argument of FROM to AS
- textDocument/completion
  - snippets support
  - instructions
  - escaper parser directive
  - ONBUILD trigger instructions
- completionItem/resolve
  - provide documentation information
- textDocument/hover
  - instructions
  - escape parser directive
  - ONBUILD trigger instructions
  - ARG and ENV variables
- textDocument/documentHighlight
  - ARG and ENV variables
  - FROM and COPY build stages
- textDocument/rename
  - ARG and ENV variables
  - FROM and COPY build stages
- textDocument/definition
  - ARG and ENV variables
  - FROM and COPY build stages
- textDocument/documentSymbol
  - instructions
  - escape parser directive
- textDocument/formatting
- textDocument/rangeFormatting

[Unreleased]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.1...HEAD
