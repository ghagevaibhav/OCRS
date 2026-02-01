FROM node:18-alpine as build
WORKDIR /app

# Accept build-time argument for API URL
ARG VITE_API_GATEWAY_URL=http://localhost:8090
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
