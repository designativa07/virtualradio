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

Para desenvolvimento local:
```
CLIENT_URL=http://localhost:3000
```

## Como criar o arquivo

1. Crie um novo arquivo de texto na raiz do projeto chamado `.env`
2. Copie e cole as configurações acima
3. Salve o arquivo
4. Reinicie o servidor para que as novas configurações sejam aplicadas

## Ambiente de Produção

Em ambiente de produção, ajuste as configurações conforme necessário:

```
NODE_ENV=production
PORT=3000
CLIENT_URL=https://virtualradio.h4xd66.easypanel.host

# Configurações do Banco de Dados de Produção
DB_HOST=seu_host_de_producao
DB_USER=seu_usuario_de_producao
DB_PASS=sua_senha_de_producao
DB_NAME=seu_banco_de_producao

# Chave de Sessão Segura (mude para uma string aleatória forte)
SESSION_SECRET=chave_secreta_forte_e_aleatoria
``` 