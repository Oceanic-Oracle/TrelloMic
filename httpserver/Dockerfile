FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY ./dist ./dist
COPY .env ./
CMD ["npm", "run", "start:dev"]