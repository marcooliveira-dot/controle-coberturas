# Controle de Coberturas

Sistema para supervisores registrarem coberturas e para o administrativo consultar e exportar a prestação de contas em Excel.

## Funcionalidades

- Acesso individual e registros próprios para supervisores.
- Consulta consolidada, filtros e cadastro de acessos para o administrativo.
- Validação de CPF, período e valores.
- Cálculo do valor total no servidor.
- Exportação `.xlsx` no modelo original, com uma aba por supervisor e mês.
- Persistência dos registros em banco de dados.

## Estado desta versão

Este repositório contém o código da versão hospedada no Sites do ChatGPT. A versão foi validada com testes locais de autorização, criação/consulta de registros, validação de entradas e exportação Excel.

A instalação pretendida é `controle.cobertura.dcasgroup.com.br`. A migração para o servidor próprio está pendente da identificação da hospedagem e do acesso ao servidor. Esta versão depende de Cloudflare Workers/D1 e do login fornecido pela plataforma Sites; não basta copiar os arquivos para uma hospedagem comum. O banco de dados e a autenticação precisam ser adaptados para o destino.

## Tecnologias

React, TypeScript, Vinext, componentes Radix/Shadcn, Drizzle, Cloudflare D1 e ExcelJS.

## Estrutura

- `app/`: interface e endpoints de sessão, coberturas e membros.
- `lib/coverage.ts`: validação e definições de dados.
- `lib/server.ts`: autorização e acesso ao banco.
- `lib/export.ts`: geração do Excel usando o modelo.
- `db/` e `drizzle/`: esquema e migração do banco.
- `public/modelo.xlsx`: modelo vazio fornecido como referência.

## Desenvolvimento da versão Sites

Requer Node.js 22.13 ou superior. Instale as dependências com `npm ci`. Use `npm run db:generate` somente quando alterar o esquema. `npm run build` gera o Worker e `npm run dev` inicia o ambiente de desenvolvimento.

Para a prévia local com banco, aplique as migrações ao D1 local de acordo com a configuração gerada em `dist/server/wrangler.json`. A autenticação local de teste é específica do ambiente de desenvolvimento e não deve ser utilizada como autenticação de produção.

## Dados e configuração

O repositório público contém apenas código e o modelo vazio. Registros de prestadores, CPFs preenchidos, contas bancárias, credenciais e arquivos de banco não fazem parte do repositório. Configure segredos no ambiente do servidor e mantenha-os fora do Git.

Antes de liberar uma instalação própria para a equipe, configure autenticação real, HTTPS, banco persistente e a conta administrativa inicial. Não confie em cabeçalhos de identidade enviados diretamente pelo navegador: na versão Sites, esses cabeçalhos são verificados pela plataforma.
