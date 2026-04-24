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

O sistema usa `localStorage` para guardar:

- bases
- usuarios
- sessao atual
- movimentos e fechamentos de cada base

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
