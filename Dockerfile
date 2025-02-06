FROM node:22-alpine3.21

RUN apk add --no-cache just uv gcc python3-dev musl-dev linux-headers postgresql-client

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000:3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["sleep", "infinity"]
