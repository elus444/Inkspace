FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY .env .env

FROM node:20-alpine

COPY --from=build /app ./

EXPOSE 5000

CMD ["npm", "run", "dev"]