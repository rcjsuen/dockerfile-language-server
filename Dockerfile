FROM node:alpine
COPY lib /docker-langserver/lib
COPY bin /docker-langserver/bin
COPY package.json /docker-langserver/package.json
WORKDIR /docker-langserver/
RUN npm install --production && \
    chmod +x /docker-langserver/bin/docker-langserver
ENTRYPOINT [ "/docker-langserver/bin/docker-langserver" ]
