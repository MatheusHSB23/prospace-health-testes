# ProSpace Health — publicação online para testes

Este repositório contém dois portais estáticos independentes que usam o mesmo projeto Supabase:

- `portal-cidadao/`: Portal Web do Cidadão.
- `gestao/`: Portal de Gestão para perfis `admin` e `health_worker`.

## Habilitar a primeira publicação

O workflow de publicação já foi adicionado ao repositório em `.github/workflows/deploy-pages.yml`.

1. Abra [Settings → Pages do repositório](https://github.com/MatheusHSB23/prospace-health-testes/settings/pages).
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Depois acesse [Actions](https://github.com/MatheusHSB23/prospace-health-testes/actions).
4. Abra **Publicar ProSpace Health (teste)** e clique em **Run workflow** se não iniciar automaticamente.
5. Aguarde a execução terminar com sucesso.

Essa configuração inicial é necessária para que o workflow possa implantar o site. O GitHub informa que a origem de publicação deve ser configurada como GitHub Actions nas configurações de Pages. Consulte a [documentação oficial](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Links após a execução bem-sucedida

- Página inicial: https://matheushsb23.github.io/prospace-health-testes/
- Portal do Cidadão: https://matheushsb23.github.io/prospace-health-testes/portal-cidadao/
- Portal de Gestão: https://matheushsb23.github.io/prospace-health-testes/gestao/

O workflow publica os dois portais no mesmo projeto Pages e atualiza o site automaticamente a cada push na branch `main`.

## Configurar autenticação no Supabase

Depois que o site estiver publicado, abra **Supabase → Authentication → URL Configuration**:

- `Site URL`: `https://matheushsb23.github.io/prospace-health-testes/portal-cidadao/`
- `Redirect URLs`: `https://matheushsb23.github.io/prospace-health-testes/portal-cidadao/**`
- Adicione também `https://matheushsb23.github.io/prospace-health-testes/gestao/**`.
- Preserve os endereços localhost que ainda utiliza no desenvolvimento.

## Segurança para ambiente de testes

- O repositório é público e o código do frontend pode ser lido por qualquer pessoa.
- Os portais usam somente a chave pública Supabase (`publishable`/anon), que foi feita para estar no navegador. Nunca coloque `service_role`, `sb_secret_`, senhas ou tokens privados no frontend.
- A proteção real dos dados depende de RLS e RPCs no Supabase.
- A Gestão verifica o perfil e aceita apenas `admin` e `health_worker`; cidadãos devem usar o Portal do Cidadão.
- Não adicione ao repositório scripts SQL de demonstração, dumps, backups ou dados pessoais.
- Use exclusivamente contas e dados fictícios; não utilize dados reais de saúde neste ambiente.
- `noindex` e `robots.txt` não constituem controle de acesso.
- Antes de qualquer uso oficial, faça uma revisão de RLS, RPCs, Storage, logs, backups e LGPD.
