FROM node:22-alpine AS build
WORKDIR /app
COPY services/pets-service/package.json ./
RUN npm install
COPY services/pets-service/tsconfig.json ./
COPY tsconfig.base.json /tsconfig.base.json
COPY services/pets-service/src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY services/pets-service/package.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3001
CMD ["node", "dist/server.js"]
