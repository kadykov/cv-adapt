FROM ghcr.io/astral-sh/uv:python3.12-bookworm

# Based on https://github.com/casey/just#pre-built-binaries
RUN curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin
