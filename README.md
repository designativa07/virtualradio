# MyRadio - Sistema de Rádio Interna

Sistema completo para criação e gerenciamento de rádios internas com reprodução de músicas e spots promocionais.

## Funcionalidades

- Sistema de login para múltiplos usuários
- Cada usuário pode criar e gerenciar suas próprias rádios
- Upload de músicas
- Upload de spots de áudio promocionais
- Reprodução automática de spots em intervalos configuráveis
- Controle de volume durante reprodução dos spots
- Efeitos de fadeout/fadein entre músicas
- Interface administrativa separada do player

## Tecnologias Utilizadas

### Backend
- Node.js com Express
- MySQL para armazenamento de dados
- Sequelize como ORM
- JWT para autenticação
- Multer para upload de arquivos

### Frontend (a ser implementado)
- React para interface do usuário
- React para painel administrativo
- HTML5 Web Audio API para efeitos de áudio

## Estrutura do Projeto

```
myradio/
├── server/             # Backend com API REST
│   ├── config/         # Configurações
│   ├── controllers/    # Controladores
│   ├── middleware/     # Middlewares
│   ├── models/         # Modelos de dados
│   ├── routes/         # Rotas da API
│   └── uploads/        # Arquivos de upload
│       ├── music/      # Músicas
│       └── spot/       # Spots
├── client/             # Frontend (interface do usuário)
└── admin/              # Painel administrativo
```

## Instalação e Execução

### Pré-requisitos
- Node.js 14+
- MySQL

### Passos para instalação

1. Clone o repositório
   ```
   git clone <url-do-repositorio>
   cd myradio
   ```

2. Instale as dependências
   ```
   npm run install-all
   ```

3. Inicie o servidor
   ```