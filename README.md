# Controle de Coberturas

Sistema para supervisores registrarem coberturas e para o administrativo consultar e baixar a prestação de contas em Excel.

## Funcionalidades

- Login próprio por e-mail e senha, sem depender de uma conta ChatGPT.
- Supervisores visualizam apenas seus registros; o administrativo consulta todos e exporta Excel.
- Cadastro de acessos com convite individual de ativação, válido por sete dias e utilizado uma única vez.
- Remoção de acesso revoga sessões imediatamente e preserva os registros anteriores. Recadastrar o mesmo e-mail recupera a propriedade dos registros.
- Validação de CPF, datas e valores, com total calculado no servidor.
- Exportação `.xlsx` no layout original de 19 colunas, separada por supervisor e mês, preservando CPFs como texto.
- Banco SQLite persistente fora da pasta das releases. Nesta instalação de teste, o backup automático fica desativado.

## Hospedagem

Versão preparada para Ubuntu com Node.js 22.13 ou superior, Nginx e systemd. O aplicativo roda apenas em `127.0.0.1:3100`; o Nginx publica o acesso por HTTPS. Não execute `next dev` em produção.

O endereço provisório da instalação é `https://bkpmail.dcasgroup.com.br/coberturas`. O domínio desejado é `controle.cobertura.dcasgroup.com.br`, pendente de apontamento DNS e emissão de certificado próprio. O acesso provisório usa uma rota separada no host HTTPS existente.

## Desenvolvimento

1. Instale as dependências com `npm ci`.
2. Crie um arquivo `.env.local` privado a partir de `.env.example`. Para desenvolvimento, configure `DATABASE_PATH` com um caminho local, `APP_ORIGIN` com sua origem local e `COOKIE_SECURE=false`.
3. Gere um `SETUP_TOKEN` aleatório de 32 bytes, representado em hexadecimal. Nunca publique o token.
4. Execute `npm run db:migrate`, com as mesmas variáveis de ambiente, antes de iniciar a aplicação.
5. Inicie com `npm run dev`. A primeira conta administrativa é criada em `/coberturas/setup` com o token inicial. Se `ADMIN_EMAIL` estiver configurado, somente esse e-mail pode criar o responsável.

As variáveis devem estar disponíveis também para os scripts de migração e backup; scripts Node não carregam `.env.local` automaticamente. Em produção, o systemd lê `/etc/controle-coberturas.env`.

## Build e verificação

```bash
NEXT_PUBLIC_BASE_PATH=/coberturas npm run build
node scripts/package-release.mjs
npm test
```

`NEXT_PUBLIC_BASE_PATH` é definido no build. O pacote standalone inclui os assets, o modelo Excel, as migrações e os arquivos de serviço. `SOURCE_COMMIT` identifica a revisão de origem em `RELEASE.json`. Compile em uma máquina de desenvolvimento ou de build; o servidor de produção não precisa instalar as dependências de desenvolvimento nem compilar a aplicação.

Os testes usam um banco temporário e contas fictícias. Cobrem token inicial, cookies seguros, rejeição de cabeçalhos de identidade falsos, convites de uso único, isolamento de registros, autorização administrativa, revogação de sessões, recadastro sem perda de propriedade, bloqueio de tentativas de login, backup e integridade do Excel.

## Instalação no servidor

O arquivo de ambiente deve conter origem HTTPS, caminho persistente do banco, token inicial e e-mail do responsável. Ele fica fora do repositório, com permissão `0600`. Os modelos em `deploy/` configuram um usuário de serviço sem login, acesso restrito ao banco e limites de memória.

O instalador `deploy/install.sh` recebe o SHA de origem, o caminho do pacote e o caminho do ambiente privado. Ele foi preparado para a configuração Nginx existente deste servidor (`backupemail.conf`); revise esse caminho em outras instalações. O instalador salva uma cópia do virtual host, acrescenta somente a rota `/coberturas`, verifica a configuração e recarrega o Nginx depois de confirmar a saúde da aplicação. O serviço é habilitado para iniciar automaticamente; o backup automático fica desativado por padrão, conforme a opção para teste. Para habilitar backups futuramente, execute o instalador com `ENABLE_BACKUPS=true`.

Dados: `/var/lib/controle-coberturas/coberturas.sqlite`. Backups: `/var/backups/controle-coberturas`. Código: `/opt/controle-coberturas/releases/<SHA>`; `current` aponta para a release ativa. Backups no mesmo servidor não substituem cópias externas para recuperação em caso de perda da máquina.

## Domínio definitivo

Quando o DNS estiver disponível, crie um registro A chamado `controle.cobertura` para o IP da instância. Depois, configure o virtual host HTTPS e o certificado, atualize `APP_ORIGIN` e reinicie o serviço. A rota `/coberturas` permanece a mesma; para servir diretamente na raiz, faça outro build com `NEXT_PUBLIC_BASE_PATH` vazio e ajuste o proxy. O banco persistente é mantido.

## Segurança e atualização

Senhas são armazenadas como hashes scrypt; tokens de sessão e convite são armazenados somente como hashes. Cookies são HttpOnly, Secure e SameSite Strict em produção. Mutações verificam a origem; tentativas de autenticação têm limites e bloqueio temporário.

O repositório público contém somente código e o modelo Excel vazio. Nunca envie chaves SSH, arquivos `.env`, senhas, tokens, bancos ou registros de prestadores ao GitHub. As migrações já aplicadas não devem ser reescritas: acrescente uma nova migração e faça backup antes de aplicá-la. A versão anterior hospedada no Sites foi preservada; a instalação própria usa autenticação e banco independentes.
