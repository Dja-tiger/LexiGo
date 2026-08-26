FROM golang:1.27.0-alpine AS build

WORKDIR /src
RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/lexigo ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=build /out/lexigo /app/lexigo

USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app/lexigo"]
