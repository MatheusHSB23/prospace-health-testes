# ProSpace Health — ambiente de testes online

Este repositório publica dois portais estáticos independentes que compartilham o mesmo projeto Supabase:

- `portal-cidadao/` — Portal Web do Cidadão.
- `gestao/` — Portal de Gestão para perfis `admin` e `health_worker`.

## Habilitação inicial do GitHub Pages (necessária uma única vez)

1. Abra **Settings** deste repositório.
2. No menu lateral, abra **Pages**.
3. Em **Build and deployment → Source**, selecione **GitHub Actions**.
4. Salve, se o GitHub solicitar.

O workflow `.github/workflows/deploy-pages.yml` já está no repositório e executa automaticamente a publicação a cada atualização da branch `main`.

Depois de habilitar Pages, abra **Actions → Publicar ProSpace Health (teste)** e escolha **Run workflow** para executar imediatamente. Aguarde a execução ficar verde.

## Endereços depois da publicação

- Página inicial: `https://matheushsb23.github.io/prospace-health-testes/`
- Portal do Cidadão: `https://matheushsb23.github.io/prospace-health-testes/portal-cidadao/`
- Portal de Gestão: `https://matheushsb23.github.io/prospace-health-testes/gestao/`

Os links só estarão ativos quando o workflow terminar com sucesso.

## Supabase Auth

Depois da publicação, abra **Supabase → Authentication → URL Configuration**:

- Defina `Site URL` como `https://matheushsb23.github.io/prospace-health-testes/portal-cidadao/`.
- Em `Redirect URLs`, adicione `https://matheushsb23.github.io/prospace-health-testes/portal-cidadao/**`.
- Adicione também `https://matheushsb23.github.io/prospace-health-testes/gestao/**`.
- Preserve os endereços localhost que ainda utiliza no desenvolvimento.

Os portais direcionam confirmação e recuperação para o endereço atual; por isso, os dois caminhos devem estar autorizados.

## Segurança

- O repositório é público: qualquer pessoa poderá ler HTML, CSS e JavaScript.
- O pacote usa somente a chave pública Supabase (`publishable`); nunca coloque `service_role`, `sb_secret_`, senhas ou tokens privados no frontend.
- A chave publishable é pública por definição. Os dados precisam continuar protegidos por RLS, RPCs e políticas de Storage no Supabase.
- A Gestão verifica perfil e aceita apenas `admin` e `health_worker`; o Portal do Cidadão exige `citizen`.
- Não publique scripts SQL, seeds, exportações, backups ou dados pessoais neste repositório.
- Use exclusivamente contas e dados fictícios. Não utilize dados reais de saúde no ambiente público de testes.
- `noindex` e `robots.txt` não substituem autenticação nem políticas de segurança.
- Antes de qualquer uso oficial, faça auditoria de RLS, RPCs, Storage, logs, backups e conformidade com LGPD.
