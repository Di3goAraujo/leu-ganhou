# Leu, Ganhou! — MVP Next.js + Supabase

Projeto web com:
- login do responsável
- perfis múltiplos de crianças
- cadastro de livros
- registro de leitura
- minutos ganhos e usados
- área dos pais protegida por PIN separado
- troca de PIN dentro da área dos pais

## Stack
- Next.js
- TypeScript
- Supabase Auth + Database
- Vercel

## Rodando localmente
```bash
npm install
npm run dev
```

Crie um arquivo `.env.local` com base em `.env.example`.

## Variáveis de ambiente
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Banco de dados
Execute o conteúdo de `supabase/schema.sql` no SQL Editor do Supabase.

## Importante nesta versão
Se você já tinha rodado o schema antigo, rode de novo o `schema.sql` atualizado para criar a tabela:
- `parent_settings`

Essa tabela guarda o PIN da área dos pais por conta.

## Fluxo do app
- O responsável entra com login e senha.
- A criança usa a área principal e o perfil dela.
- A área dos pais pede PIN separado.
- PIN inicial: `1234`
- Os pais podem trocar o PIN dentro da área dos pais.
