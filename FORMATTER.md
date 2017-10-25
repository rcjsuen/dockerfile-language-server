# Formatting Dockerfiles

The formatter included will perform the following operations on a Dockerfile:

- remove leading whitespace if it begins with an instruction
- remove trailing whitespace if and only if the line only contains whitespace characters
- take escaped newlines into account and indent Dockerfile instructions that span multiple lines

## Command Line Interface

The formatter used by the language server can be run standalone from the CLI.
If no file is specified, the CLI will attempt to format the contents of a file named `Dockerfile` in the current working directory if it exists.

### Help
```
> docker-langserver format --help
Usage: docker-langserver format [options] [file]

Options:

  -h, --help                Output usage information
  -s, --spaces <number>     Format with the <number> of spaces
  -t, --tabs                Format with tabs
```

### Example
```Dockerfile
      FROM node
HEALTHCHECK --interva=30s CMD ls
  RUN "echo" ls \
  
  "echoS"sdfdf \
  asdfasdf
  copy . .
ADD app.zip
CMD ls
```
#### Formatting with Tabs
```
> docker-langserver format -t
FROM node
HEALTHCHECK --interva=30s CMD ls
RUN "echo" ls \

	"echoS"sdfdf \
	asdfasdf
copy . .
ADD app.zip
CMD ls
```
#### Formatting with Spaces
```
> docker-langserver format -s 5
FROM node
HEALTHCHECK --interva=30s CMD ls
RUN "echo" ls \

     "echoS"sdfdf \
     asdfasdf
copy . .
ADD app.zip
CMD ls
```
