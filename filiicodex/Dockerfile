ARG BUILD_FROM=ghcr.io/hassio-addons/base:10.1.1
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Copy root filesystem
COPY rootfs/etc /etc/
COPY \
    rootfs/opt/filiicodex/package.json \
    rootfs/opt/filiicodex/yarn.lock \
    /opt/filiicodex/

# Setup base
# hadolint ignore=DL3003
RUN \
    apk add --no-cache --virtual .build-dependencies \
        build-base=0.5-r2 \
        npm=7.17.0-r0 \
        python2=2.7.18-r0 \
    \
    && apk add --no-cache \
        nodejs=14.18.1-r0 \
    \
    && cd /opt/filiicodex \
    \
    && npm install --production \
    \
    && npx mod-pruner prune --force \
    \
    && apk del --no-cache --purge .build-dependencies

COPY rootfs/opt/filiicodex/index.js /opt/filiicodex/

# Build arugments
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION

# Labels
LABEL \
    io.hass.name="${BUILD_NAME}" \
    io.hass.description="${BUILD_DESCRIPTION}" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version=${BUILD_VERSION} \
    maintainer="Jorim Tielemans <tielemans.jorim@gmail.com>" \
    org.opencontainers.image.title="${BUILD_NAME}" \
    org.opencontainers.image.description="${BUILD_DESCRIPTION}" \
    org.opencontainers.image.vendor="Filii Lamberti" \
    org.opencontainers.image.authors="Jorim Tielemans <tielemans.jorim@gmail.com>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/filii-lamberti/filii-addons" \
    org.opencontainers.image.source="https://github.com/${BUILD_REPOSITORY}" \
    org.opencontainers.image.documentation="https://github.com/${BUILD_REPOSITORY}/blob/main/README.md" \
    org.opencontainers.image.created=${BUILD_DATE} \
    org.opencontainers.image.revision=${BUILD_REF} \
    org.opencontainers.image.version=${BUILD_VERSION}