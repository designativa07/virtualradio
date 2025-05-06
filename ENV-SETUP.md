# Configuração do Ambiente VirtualRadio

Para que o sistema funcione corretamente, você precisa configurar o arquivo `.env` na raiz do projeto com as seguintes variáveis:

## Configurações do Banco de Dados

```
DB_HOST=localhost
DB_USER=desig938_myradio
DB_PASS=giNdvTR[l*Tm
DB_NAME=desig938_myradio
```

## Configurações do Servidor

```
PORT=3000
NODE_ENV=development
```

## Segurança

```
SESSION_SECRET=virtual_radio_secret_key_2024
```

## URLs

```
CLIENT_URL=http://localhost:3001
```

## Como criar o arquivo

1. Crie um novo arquivo de texto na raiz do projeto chamado `.env`
2. Copie e cole as configurações acima
3. Salve o arquivo
4. Reinicie o servidor para que as novas configurações sejam aplicadas

## Ambiente de Produção

Em ambiente de produção, ajuste as configurações conforme necessário, especialmente:

```
NODE_ENV=production
CLIENT_URL=[URL de produção do cliente]
``` 