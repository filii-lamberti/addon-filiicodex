ARG BUILD_FROM=hassioaddons/base:7.0.3
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install requirements for add-on and app dependencies
RUN \
    apk add --no-cache --virtual .build-dependencies \
        g++=9.2.0-r3 \
        make=4.2.1-r2 \
        python2=2.7.16-r3

# Copy root filesystem
COPY rootfs /

RUN \
    cd /opt/filiicodex \
    \
    && npm install \
        --no-optional \
        --only=production \
    \
    && npm cache clear --force \
    \
    && apk del --purge .build-dependencies

# Build arugments
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_REF
ARG BUILD_VERSION

# Labels
LABEL \
    io.hass.name="Filiicodex" \
    io.hass.description="A Filiicodex add-on for Home Assistant!" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version=${BUILD_VERSION} \
    maintainer="Jorim Tielemans <tielemans.jorim@gmail.com>" \
    org.label-schema.description="A Filiicodex add-on for Home Assistant!" \
    org.label-schema.build-date=${BUILD_DATE} \
    org.label-schema.name="Filiicodex" \
    org.label-schema.schema-version="1.0" \
    org.label-schema.url="https://addons.community" \
    org.label-schema.usage="https://gitlab.com/filii-lamberti/addon-filiicodex" \
    org.label-schema.vcs-ref=${BUILD_REF} \
    org.label-schema.vcs-url="https://gitlab.com/filii-lamberti/filii-addons" \
    org.label-schema.vendor="Filii Lamberti"