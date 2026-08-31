FROM node:24 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_APPKIT_PUBLIC_PROJECT_ID
ENV VITE_APPKIT_PUBLIC_PROJECT_ID=$VITE_APPKIT_PUBLIC_PROJECT_ID

RUN npm run build

FROM nginx:alpine

RUN apk add --no-cache ca-certificates

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
