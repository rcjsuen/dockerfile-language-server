FROM node:alpine
COPY lib /docker-langserver/lib
COPY bin /docker-langserver/bin
ENTRYPOINT [ "/docker-langserver/bin/docker-langserver" ]
