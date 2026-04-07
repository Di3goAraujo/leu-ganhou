# Leu, Ganhou! — MVP Next.js + Supabase

Projeto pronto para evoluir o app infantil de leitura em uma versão web profissional com área dos pais.

## Stack
- Next.js App Router
- React + TypeScript
- Supabase Auth
- Supabase Postgres + RLS

## O que já vem pronto
- Login e cadastro do responsável
- Dashboard com perfis das crianças
- Perfil individual de cada criança
- Cadastro de livros
- Registro de leitura com regra de 2 minutos por página
- Uso de minutos
- Área dos pais com bônus, exclusão de criança e exclusão de livro
- Relatórios básicos

## 1) Criar o projeto no Supabase
1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute o arquivo `supabase/schema.sql`.
4. Em **Project Settings > API**, copie:
   - `Project URL`
   - `anon public key`

## 2) Configurar ambiente local
Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

## 3) Instalar dependências
Use Node.js 20.9 ou superior. O Next.js App Router lista Node 20.9 como mínimo na documentação oficial. citeturn327637search7turn327637search1

```bash
npm install
```

## 4) Rodar o projeto
```bash
npm run dev
```

Abra `http://localhost:3000`.

## 5) Publicar
Você pode publicar na Vercel. O fluxo oficial do Next.js continua centrado no App Router e deploy em plataformas compatíveis com recursos do framework. citeturn327637search11turn327637search16

## 6) GitHub
```bash
git init
git add .
git commit -m "feat: leu ganhou mvp com supabase"
```

Depois crie o repositório no GitHub e rode:

```bash
git remote add origin https://github.com/SEU-USUARIO/leu-ganhou.git
git branch -M main
git push -u origin main
```

## Observações
O quickstart oficial do Supabase para Next.js usa App Router, TypeScript e autenticação configurada para esse stack. citeturn327637search0turn327637search2
