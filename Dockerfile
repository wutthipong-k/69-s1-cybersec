FROM prawee/strapi

USER root
RUN mkdir -p /opt/extras && cd /opt/extras && echo "{}" > package.json && npm install --no-save --no-audit --no-fund --package-lock=false @strapi/provider-email-nodemailer@4
ENV NODE_PATH=/opt/extras/node_modules
USER node