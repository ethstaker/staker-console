FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_APPKIT_PUBLIC_PROJECT_ID
ENV VITE_APPKIT_PUBLIC_PROJECT_ID=$VITE_APPKIT_PUBLIC_PROJECT_ID

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
