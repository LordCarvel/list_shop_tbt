# TBT Estoque

Sistema front-end de estoque com autenticacao por base.

## O que existe agora

- cada dono cria a propria base
- cada base tem seu proprio estoque, usuarios e pizzarias
- o dono configura usuario e senha de cada pizzaria
- o login da pizzaria acessa apenas a propria unidade
- o dono acessa dashboard, central, filiais, ajustes, produtos e acessos

## Regras de acesso

- `dono`: acesso total da base
- `loja`: acesso apenas ao fechamento e ao estoque da propria pizzaria

## Regras de estoque

- saldo nunca e editado direto
- estoque = entradas + transferencias recebidas - transferencias enviadas + ajustes
- fechamento diario trava a data da pizzaria
- divergencia ate 2% = normal
- divergencia acima de 2% = alerta
- divergencia acima de 5% = observacao obrigatoria
- peso salvo em `g`
- liquido salvo em `ml`
- itens salvos em `unidade`

## Persistencia

O sistema sincroniza os dados com a API Spring Boot. O `localStorage` fica apenas como cache local e para guardar o token da sessao.

- bases
- usuarios
- sessao atual
- movimentos e fechamentos de cada base

## Deploy

Frontend no GitHub Pages:

- crie `.env.production` com `VITE_API_URL=https://seu-backend.onrender.com`
- rode `npm run build`
- envie o conteudo de `dist/` para o GitHub Pages manualmente

Backend no Render:

- root directory: `listShopTbt/listShopTbt`
- build: `chmod +x ./mvnw && ./mvnw -DskipTests package`
- start: `java -jar target/listShopTbt-0.0.1-SNAPSHOT.jar`
- configure as variaveis de `.env.render.example`

Banco no Supabase:

- use a connection string JDBC PostgreSQL com `sslmode=require`
- exemplo: `jdbc:postgresql://host:6543/postgres?sslmode=require`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
