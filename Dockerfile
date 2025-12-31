FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_APPWRITE_ENDPOINT
ARG VITE_APPWRITE_PROJECT_ID
ARG VITE_APPWRITE_DATABASE_ID
ARG VITE_APPWRITE_WORKSHOP_COLLECTION_ID
ARG VITE_APPWRITE_PARTICIPANT_COLLECTION_ID

ENV VITE_APPWRITE_ENDPOINT=$VITE_APPWRITE_ENDPOINT
ENV VITE_APPWRITE_PROJECT_ID=$VITE_APPWRITE_PROJECT_ID
ENV VITE_APPWRITE_DATABASE_ID=$VITE_APPWRITE_DATABASE_ID
ENV VITE_APPWRITE_WORKSHOP_COLLECTION_ID=$VITE_APPWRITE_WORKSHOP_COLLECTION_ID
ENV VITE_APPWRITE_PARTICIPANT_COLLECTION_ID=$VITE_APPWRITE_PARTICIPANT_COLLECTION_ID

COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]