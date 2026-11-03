# ProSpace Health — publicação online para testes

Este pacote contém **dois sites estáticos independentes** que usam o mesmo projeto Supabase:

- `portal-cidadao/`: Portal Web do Cidadão.
- `gestao/`: Portal de Gestão, com autenticação para `admin` e `health_worker`.

Os arquivos foram preparados para Vercel. Não há etapa de build, Node, Flutter ou Android Studio.

## Publicar os dois sites no Vercel com um único repositório GitHub

1. Extraia este ZIP.
2. No GitHub, crie um repositório **privado** chamado `prospace-health-online-testes`.
3. Envie para o repositório as duas pastas (`portal-cidadao` e `gestao`) preservando os nomes e os arquivos internos.
4. No Vercel, escolha **Add New → Project** e importe esse mesmo repositório.
5. Crie o primeiro projeto com:
   - Project Name: `prospace-cidadao` (ou outro nome disponível).
   - Framework Preset: `Other`.
   - Root Directory: `portal-cidadao`.
   - Build Command: deixe vazio / sem build.
   - Output Directory: `.` (raiz do projeto selecionado).
6. Crie o segundo projeto importando o mesmo repositório, com:
   - Project Name: `prospace-gestao` (ou outro nome disponível).
   - Framework Preset: `Other`.
   - Root Directory: `gestao`.
   - Build Command: deixe vazio / sem build.
   - Output Directory: `.`.
7. Aguarde o status `Ready` nos dois projetos. O Vercel mostrará duas URLs HTTPS distintas.

## Configuração de autenticação no Supabase depois de receber as URLs

No Supabase, abra **Authentication → URL Configuration**.

- Defina `Site URL` para a URL HTTPS principal do Portal do Cidadão.
- Em `Redirect URLs`, adicione a URL exata do cidadão com `/**` no final, por exemplo `https://prospace-cidadao-SEU-SUFIXO.vercel.app/**`.
- Adicione também a URL exata do Gestão com `/**` no final, por exemplo `https://prospace-gestao-SEU-SUFIXO.vercel.app/**`.
- Durante desenvolvimento local, mantenha `http://localhost:7358/**` e `http://127.0.0.1:7358/**` para o cidadão; para a Gestão, `http://localhost:8090/**` e `http://127.0.0.1:8090/**`.
- Evite liberar um wildcard genérico amplo em produção. Prefira as duas URLs finais exatas.

O Cidadão usa `location.origin` como destino para confirmação e recuperação; a Gestão usa a origem atual para recuperação de senha. Por isso, essas origens devem estar liberadas no Supabase.

## Segurança para ambiente de teste

- Os dois sites usam a chave pública (`publishable`/`anon`) do Supabase. Essa chave aparece no navegador e **não é um segredo**.
- Nunca adicione `service_role`, `sb_secret_` ou tokens privados ao JavaScript, HTML, CSS, `vercel.json` ou a variáveis `NEXT_PUBLIC_*`.
- A proteção dos dados depende de RLS e das funções RPC no banco. A interface sozinha não protege registros.
- O painel Gestão verifica o perfil e aceita apenas `admin` e `health_worker`; cidadãos devem usar o Portal do Cidadão.
- Este pacote contém apenas arquivos de execução web. Scripts SQL, seeds demonstrativos e dados de teste foram deixados de fora.
- `noindex` foi habilitado para evitar indexação por mecanismos de busca durante os testes; isso **não** é controle de acesso.
- Use contas fictícias de teste e nunca coloque dados reais de pacientes em um ambiente público de teste.

## Verificação depois da publicação

1. Abra a URL do Cidadão em janela anônima e confirme que aparece a tela de login/cadastro.
2. Crie ou use uma conta `citizen` de teste e valide confirmação/recuperação de e-mail.
3. Abra a URL da Gestão e tente entrar com a conta de cidadão: o portal deve negar o acesso.
4. Entre na Gestão com uma conta `admin` ou `health_worker` autorizada.
5. Teste unidades, pacientes, agenda e solicitações apenas com dados fictícios.
6. Teste os links de confirmação e recuperação nos dois domínios.

## Observação

A publicação online cria dois endereços públicos com HTTPS. A autenticação é obrigatória para abrir dados pessoais. Antes de qualquer uso com dados reais de saúde, faça revisão técnica das políticas RLS, RPCs, permissões de storage, logs, backups e LGPD. Este pacote é para homologação/testes, não uma certificação de produção.
