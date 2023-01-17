FROM node:16.13.1-alpine as builder

# Create application directory
WORKDIR /app

# Install application data
COPY . ./

# Install application dependencies
RUN yarn install
RUN yarn build

FROM nginx as server

COPY --from=builder /app/dist /usr/share/nginx
COPY nginx.config /etc/nginx/conf.d/default.conf
EXPOSE 80

