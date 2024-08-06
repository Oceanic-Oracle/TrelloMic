FROM golang:1.20-alpine
WORKDIR /usr/local/src
RUN apk --no-cache add bash gettext
COPY ["go.mod", "go.sum", "./"]
RUN go mod download