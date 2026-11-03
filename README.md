# ProSpace Health — ambiente de testes online

O repositório contém dois portais estáticos independentes que compartilham o mesmo Supabase:

- `portal-cidadao/` — Portal Web do Cidadão.
- `gestao/` — Portal de Gestão para `admin` e `health_worker`.

## Publicação automática com GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` publica os arquivos a cada push na branch `main` e também pode ser executado manualmente em **Actions**.

1. Crie um repositório público vazio chamado `prospace-health-testes` na conta GitHub que será dona do projeto. Não adicione README, licença nem `.gitignore` inicial.
2. Extraia o ZIP deste pacote e envie **o conteúdo da pasta `ProSpace_Online_Testes`** para a raiz do repositório, mantendo `.github`, `portal-cidadao` e `gestao` (ative a exibição de arquivos ocultos para não perder `.github` e `.nojekyll`).
3. Faça commit na branch `main`.
4. Abra a aba **Actions** do repositório e confira o workflow `Publicar ProSpace Health (teste)`. Aguarde ficar verde.
5. A URL base será `https://matheushsb23.github.io/prospace-health-testes/` e os portais ficarão em `/portal-cidadao/` e `/gestao/`.

Se o workflow não iniciar, abra **Settings → Actions → General** e habilite permissões de leitura e escrita para GitHub Actions; depois execute novamente o workflow.

## Supabase Auth

Depois da publicação, em **Supabase → Authentication → URL Configuration**:

- `Site URL`: URL do Portal do Cidadão, incluindo `/portal-cidadao/`.
- `Redirect URLs`: adicione `https://matheushsb23.github.io/prospace-health-testes/portal-cidadao/**` e `https://matheushsb23.github.io/prospace-health-testes/gestao/**`.
- Mantenha também os endereços `localhost` usados no desenvolvimento, se ainda forem necessários.

Os portais usam `location.origin + location.pathname` como destino de confirmação/recuperação; por isso os dois caminhos precisam estar autorizados.

## Segurança

- Este pacote contém apenas arquivos públicos de frontend, logos e configuração com chave pública Supabase (`publishable`/`anon`). Não contém SQL, seeds, senha, `service_role` nem `sb_secret_`.
- O repositório será público: qualquer pessoa poderá ler o código HTML, CSS e JavaScript. A chave publishable é pública por definição; os dados devem continuar protegidos por RLS e RPCs no Supabase.
- A Gestão verifica o perfil do usuário e só aceita `admin` e `health_worker`; o Portal do Cidadão recusa esses perfis e exige `citizen`.
- `noindex` e `robots.txt` ajudam a evitar indexação, mas não são uma barreira de segurança.
- Use somente dados e contas fictícias. Não cadastre dados reais de saúde nesse ambiente público de testes.
- Antes de uso real, revise RLS, RPCs, Storage, logs, backups e conformidade com LGPD com profissional qualificado.
