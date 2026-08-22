# Criatorio Dantas - Cadastro de Aves

Sistema de cadastro de aves com foto, arvore genealogica, controle de casais,
geracao de placa de identificacao e controle financeiro (compras, vendas e
despesas do plantel). Multi-usuario: cada pessoa que criar conta ve e edita
somente o proprio cadastro.

## 1. Criar o banco de dados (Supabase - gratuito)

1. Cria uma conta em https://supabase.com e um novo projeto.
2. No painel do projeto, abre **SQL Editor** > **New query**, cola o
   conteudo do arquivo `supabase/schema.sql` deste projeto e roda (RUN).
   Isso cria as tabelas `aves` e `despesas` ja com seguranca por usuario.
3. Em **Authentication > Providers**, confirma que "Email" esta habilitado
   (vem habilitado por padrao). Se quiser pular a confirmacao por e-mail
   durante os testes, va em **Authentication > Settings** e desative
   "Confirm email".
4. Em **Project Settings > API**, copia a **Project URL** e a chave
   **anon public**.

## 2. Rodar localmente

```bash
npm install
cp .env.example .env
# edita o .env e cola a URL e a anon key do passo 1
npm run dev
```

Abre o endereco que o Vite mostrar (geralmente http://localhost:5173).
Cria uma conta pela tela de login pra comecar a usar.

## 3. Subir pro GitHub

```bash
git init
git add .
git commit -m "Sistema de cadastro de aves"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git push -u origin main
```

O `.env` nao vai junto (esta no `.gitignore`) - suas chaves ficam seguras.

## 4. Publicar online (Vercel, gratuito)

1. Entra em https://vercel.com, conecta sua conta do GitHub.
2. "Add New Project" > escolhe o repositorio que voce acabou de subir.
3. Em **Environment Variables**, adiciona:
   - `VITE_SUPABASE_URL` = a URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` = a anon key
4. Deploy. Em 1-2 minutos voce tem uma URL publica (tipo
   `seu-projeto.vercel.app`) que qualquer pessoa pode acessar, criar conta
   e usar o proprio cadastro.

Toda vez que voce der `git push`, a Vercel atualiza o site sozinha.

## Estrutura do projeto

- `src/App.jsx` - toda a interface (lista, cadastro, arvore genealogica,
  gerador de placa, financeiro)
- `src/lib/db.js` - camada que fala com o Supabase (salvar/listar/remover)
- `src/components/AuthPage.jsx` - tela de login/criar conta
- `supabase/schema.sql` - script que cria as tabelas no banco

## Sobre as fotos

As fotos sao comprimidas no navegador e guardadas junto com o resto dos
dados da ave (coluna `data`, em base64). Isso funciona bem para uso normal.
Se no futuro o cadastro crescer muito (centenas de aves com foto), vale a
pena migrar as fotos pro **Supabase Storage** (bucket dedicado) em vez de
guardar em base64 - isso deixa o carregamento da lista mais rapido.
