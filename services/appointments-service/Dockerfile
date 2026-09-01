FROM node:22-alpine AS build
WORKDIR /app
COPY services/appointments-service/package.json ./
RUN npm install
COPY services/appointments-service/tsconfig.json ./
COPY tsconfig.base.json /tsconfig.base.json
COPY services/appointments-service/src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3002
COPY services/appointments-service/package.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3002
CMD ["node", "dist/server.js"]
