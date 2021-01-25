FROM node:10-buster

ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /usr/local/bin/wait-for
RUN chmod +x /usr/local/bin/wait-for

WORKDIR /app

COPY package.json npm-shrinkwrap.json ./
RUN npm install

COPY . .
ENTRYPOINT ["bin/entrypoint"]

CMD ["wait-for", "postgres:5432", "--", "npm", "run", "test"]
