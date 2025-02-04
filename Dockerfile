# FROM nikolaik/python-nodejs:python3.12-nodejs22-alpine
FROM node:22-alpine3.21

RUN apk add --no-cache just uv gcc python3-dev musl-dev linux-headers

EXPOSE 3000:3000
