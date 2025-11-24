FROM node:20-bookworm

WORKDIR /app

COPY package.json package-lock.json* ./

RUN apt-get update && apt-get install -y libc6 libstdc++6 python3 make g++

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
