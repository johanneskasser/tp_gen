FROM kong:2.8.1

# Install envsubst (gettext package — Alpine-based Kong image)
USER root
RUN apk add --no-cache gettext

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER kong
ENTRYPOINT ["/docker-entrypoint.sh"]
