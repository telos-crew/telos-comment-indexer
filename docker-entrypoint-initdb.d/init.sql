services:
  postgres:
    container_name: postgres
    image: postgres:13
    volumes:
      - postgres_volume:/var/lib/postgresql/data
      - ./dockerConfig/postgres-dev-init.sql:/docker-entrypoint-initdb.d/init.sql # will setup dev database adonis_app for us
    environment:
      POSTGRES_USER: comment
      POSTGRES_PASSWORD: 'S4pient!postgres'
    ports:
      - 5432:5432
