FROM kong:2.8.1

# Install envsubst (gettext package — Alpine-based Kong image)
USER root
RUN apk add --no-cache gettext

COPY docker-entrypoint.sh /kong-init.sh
RUN chmod +x /kong-init.sh

USER kong
ENTRYPOINT ["/kong-init.sh"]
