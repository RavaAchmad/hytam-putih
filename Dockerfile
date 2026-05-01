FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV ADMIN_TOKEN=change-this-secure-token

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY --chown=node:node app ./app
COPY --chown=node:node public ./public
COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node next.config.mjs postcss.config.mjs tailwind.config.js tsconfig.json ./
RUN npm run build
RUN npm prune --omit=dev
RUN mkdir -p /app/data && chown -R node:node /app/data

USER node
EXPOSE 3000

CMD ["npm", "start"]
