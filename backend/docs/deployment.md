# Déploiement

## Prérequis
- Java 25 (Temurin recommandé)
- 256 Mo RAM minimum pour un arbre de < 10 000 personnes

## JAR + systemd (recommandé pour usage familial)

```bash
mvn -f backend/pom.xml clean package
# Produit backend/target/family-tree-backend-1.0.0-SNAPSHOT.jar
```

`/etc/systemd/system/family-tree.service` :

```ini
[Unit]
Description=Family Tree backend
After=network.target

[Service]
User=family
WorkingDirectory=/opt/family-tree
Environment=JWT_SECRET=<remplacer-par-une-valeur-aléatoire-64-caractères>
ExecStart=/usr/bin/java -jar family-tree-backend-1.0.0-SNAPSHOT.jar
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Docker

```dockerfile
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY target/family-tree-backend-*.jar app.jar
VOLUME /app/data
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
```

```bash
docker build -t family-tree ./backend
docker run -d --name family-tree \
  -p 8080:8080 \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -v $(pwd)/data:/app/data \
  family-tree
```

## Reverse proxy (Nginx) + HTTPS

```nginx
server {
  server_name genealogie.exemple.fr;
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 50M;   # pour uploads médias
  }
  listen 443 ssl;
  # certificats Let's Encrypt via certbot
}
```

## Sauvegardes

Le dossier `data/` contient toutes les données. Une sauvegarde consiste à copier ce dossier (rsync, borgbackup, restic). 

Prévoyez un snapshot quotidien.
