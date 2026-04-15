FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM node:20-alpine

WORKDIR /app
COPY --from=build /app .

EXPOSE 5002
CMD ["npm", "run", "dev"]