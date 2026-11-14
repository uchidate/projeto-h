# Relatório diário de saúde

O workflow `.github/workflows/relatorio-saude.yml` consolida sinais operacionais
em uma Issue fixa chamada **📋 Relatório diário de saúde**.

## O que ele verifica

- workflows da branch principal que falharam nas últimas 24 horas;
- pull requests abertas pelo Dependabot;
- Issues operacionais abertas pelos vigias existentes;
- histórico diário por comentários na Issue consolidada.

O relatório usa apenas a API do GitHub. Não há modelo de IA, chamada externa,
instalação de dependências ou execução do código da aplicação. Portanto, a
rotina não consome créditos do Copilot.

## Quando roda

Roda todos os dias às 09:45 no horário de Brasília e também pode ser disparado
manualmente em **Actions → 📋 Relatório diário de saúde → Run workflow**.

O workflow ignora falhas de pull requests porque elas já são apresentadas no
próprio PR. Também não substitui os vigias: o `watchdog` continua detectando
workflows agendados parados, enquanto este relatório oferece uma visão diária
consolidada.

## Como usar o resultado

1. Abra a Issue com a label `relatorio-saude`.
2. Comece pelos workflows que falharam.
3. Use os links para abrir diretamente a execução ou o alerta operacional.
4. Quando uma falha for bem delimitada, abra ou atribua uma Issue específica ao
   Copilot Coding Agent para investigação e correção em um PR.

O relatório é informativo: ele não fecha Issues, reexecuta workflows nem altera
produção automaticamente.
