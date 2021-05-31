# Install node v10
FROM node:14.15.4-buster-slim AS vhapp

# Set the workdir /var/www/myapp
WORKDIR /vhapp

# Copy the package.json to workdir

RUN apt-get update \
  && apt-get -y install dh-autoreconf libcurl4-gnutls-dev libexpat1-dev \
  gettext libz-dev libssl-dev git \
  && apt-get install -y build-essential curl libpq-dev --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man \
  && apt-get clean \
  && mkdir -p /node_modules && chown node:node -R /node_modules /vhapp

USER node

COPY --chown=node:node package*.json ./
# Run npm install - install the npm dependencies
RUN npm install --only=production

# Copy application source
COPY . .

# Copy .env.docker to workdir/.env - use the docker env
COPY .env ./.env

# Expose application ports - 8080
EXPOSE 8080

# Start the application
CMD ["npm", "run", "prod"]