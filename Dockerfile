FROM node:alpine
COPY lib /docker-langserver/lib
COPY bin /docker-langserver/bin
RUN chmod +x /docker-langserver/bin/docker-langserver
ENTRYPOINT [ "/docker-langserver/bin/docker-langserver" ]
