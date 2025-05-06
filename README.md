# MyRadio - Sistema de Rádio Interna Personalizada

Sistema de gerenciamento de rádio interna que permite criar e gerenciar múltiplas rádios com músicas e spots publicitários.

## Funcionalidades

- ✅ Gerenciamento de múltiplas rádios
- ✅ Upload de músicas e spots
- ✅ Controle de volume independente para músicas e spots
- ✅ Programação de spots publicitários
- ✅ Interface administrativa
- ✅ Interface do cliente para reprodução
- ✅ Suporte a múltiplos formatos de áudio
- ✅ Sistema de usuários e permissões

## Requisitos

- Node.js 18+
- MySQL 8.0+
- NPM ou Yarn

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/myradio.git
cd myradio
```

2. Instale as dependências:
```bash
npm run install-all
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações:
```env
NODE_ENV=production
PORT=5000

# Database
DB_HOST=seu-host
DB_PORT=3306
DB_NAME=seu-banco
DB_USER=seu-usuario
DB_PASS=sua-senha

# API
API_URL=https://seu-dominio.com/api
```

4. Crie as pastas necessárias:
```bash
npm run setup
```

5. Inicie o servidor:
```bash
npm start
```

## Estrutura do Projeto

```
myradio/
├── admin/          # Interface administrativa
├── client/         # Interface do cliente
├── server/         # Backend
│   ├── config/     # Configurações
│   ├── controllers/# Controladores
│   ├── middleware/ # Middlewares
│   ├── models/     # Modelos do banco de dados
│   ├── routes/     # Rotas da API
│   └── uploads/    # Arquivos enviados
└── scripts/        # Scripts utilitários
```

## Scripts Disponíveis

- `npm start`: Inicia o servidor em modo produção
- `npm run dev`: Inicia o servidor em modo desenvolvimento
- `npm run client`: Inicia a interface do cliente
- `npm run admin`: Inicia a interface administrativa
- `npm run install-all`: Instala todas as dependências
- `npm run build`: Compila os projetos client e admin
- `npm run setup`: Configura as pastas necessárias

## API

A documentação completa da API está disponível em `/api-docs` após iniciar o servidor.

Endpoints principais:
- `/api/auth`: Autenticação
- `/api/radios`: Gerenciamento de rádios
- `/api/music`: Gerenciamento de músicas
- `/api/spots`: Gerenciamento de spots

## Contribuição

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença ISC - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Suporte

Em caso de problemas:
1. Verifique as issues existentes
2. Execute o diagnóstico: `node server/debug.js`
3. Consulte os logs em `debug-log.txt`
4. Abra uma nova issue com os detalhes do problema