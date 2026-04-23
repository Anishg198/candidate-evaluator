FROM node:20-alpine AS build
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
ARG VITE_MODULE1_URL=http://localhost:8000
ARG VITE_MODULE2_URL=http://localhost:8002
ARG VITE_MODULE4_URL=http://localhost:8004
ARG VITE_MODULE5_URL=http://localhost:8005
ENV VITE_MODULE1_URL=$VITE_MODULE1_URL
ENV VITE_MODULE2_URL=$VITE_MODULE2_URL
ENV VITE_MODULE4_URL=$VITE_MODULE4_URL
ENV VITE_MODULE5_URL=$VITE_MODULE5_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
