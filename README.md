<div align="center">
  <br/>
  <h3><a href="https://dmsflow.pl">dmsflow.pl</a></h3>
  <br/>
</div>

## HOW TO RUN
```bash
just run live on: https://dmsflow.pl
```
<br/>
<br/>

Wymagania: Docker, Java 21, Bun.

### 1. DOCKER
```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Backend :8000
```properties
openai.api-key=sk-...
admin.key=....
```
Uruchom:
```bash
./mvnw spring-boot:run
```

### 3. Frontend :3000
```bash
bun install
bun run dev
```
