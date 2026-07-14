# 🚀 Gerador de Propostas & Contratos Rakta Lab

Um aplicativo interativo de alta performance projetado para a criação, personalização e exportação de **Propostas Comerciais** (formato widescreen 16:9) e **Contratos de Prestação de Serviços (MSA)** (formato A4 para impressão). A plataforma é adaptada à identidade visual do site **rakta.digital**, conta com suporte a múltiplos temas e integra Inteligência Artificial (Gemini) para otimizar escopos de serviços de acordo com o nicho de negócio do cliente.

---

## 💻 Como Executar o Projeto

Você pode executar este projeto de duas formas: através de um servidor local de desenvolvimento (Vite) ou abrindo o arquivo diretamente no navegador.

### Método 1: Servidor Local com Vite (Recomendado)
Este método garante que todas as requisições (como chamadas de API do Gemini, persistência local e carregamento de fontes) funcionem perfeitamente sem restrições de segurança do navegador.

1. **Instale as dependências** do projeto (certifique-se de ter o [Node.js](https://nodejs.org/) instalado):
   ```bash
   npm install
   ```
2. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
3. **Acesse o link** fornecido no terminal (geralmente `http://localhost:5173`).

---

### Método 2: Acesso Direto (Sem Dependências / Zero Setup)
Ideal para demonstrações rápidas. O projeto foi estruturado para funcionar de forma estática:

1. Dê um **duplo clique no arquivo `index.html`** no seu gerenciador de arquivos.
2. O aplicativo abrirá no seu navegador padrão.
   > [!NOTE]
   > Dependendo das configurações de segurança do navegador, algumas requisições de API (como a otimização com IA do Gemini) podem sofrer restrições de CORS ao rodar pelo protocolo `file://`. Para uso corporativo completo, prefira o **Método 1**.

---

## 🛠️ Recursos e Funcionalidades

O sistema utiliza um layout split-screen (Painel de Controle à esquerda e Preview interativo em tempo real à direita), dividido em dois modos principais:

### 📑 1. Aba de Proposta Comercial
*   **Identificação do Cliente**: Personalização rápida do nome do cliente, título do projeto e prazo de validade da proposta (com cálculo automático da data limite).
*   **Identidade Visual (Temas)**: Seletor de cores instantâneo no painel para alternar a interface e a proposta entre quatro paletas sofisticadas:
    *   🔴 **Rakta** (Vermelho institucional)
    *   🟡 **Gold** (Dourado premium)
    *   🔵 **Tech** (Azul tecnologia)
    *   🟢 **Emerald** (Verde esmeralda)
*   **Modelos de Nicho**: Configurações pré-definidas para carregar dores e estratégias específicas para nichos como *E-commerce*, *SaaS B2B*, *Saúde & Clínicas*, *Negócios Locais*, *Imobiliário* e *Infoprodutos*.
*   **Escopo Dinâmico de Serviços**:
    *   Filtros inteligentes em formato accordion divididos entre *Serviços Recorrentes* e *Pontuais*.
    *   Dropdown dinâmico `+ Adicionar em...` para inclusão sob demanda de entregáveis.
    *   Cards de customização para ajustar o **Nível** (*Entrada, Intermediário, Avançado*), **Preços**, **Mensalidade** do CRM/Chatbot (se houver), marcar como **Bônus** e editar a descrição em tempo real.
    *   Opção de **Criar Serviço Customizado** definindo nome, tipo, categoria, valor e entregáveis do zero.
*   **Inteligência Artificial (Gemini)**:
    *   Integração direta com a API do Gemini (salva localmente no navegador de forma segura).
    *   Botão global para adaptar todos os escopos ao nicho do cliente e tom desejado (*Persuasivo, Técnico, Direto*).
    *   Botão individual nos cards de serviço para otimizar apenas aquele escopo via IA.
*   **Ajuste Final de Valores**: Campos dedicados para sobrescrever manualmente ou aplicar descontos nos totais recorrentes ou de setup.
*   **Gerenciamento de Rascunhos**:
    *   **Exportar Rascunho**: Baixa um arquivo `.json` com o estado atual da sua proposta.
    *   **Importar Rascunho**: Carrega propostas salvas anteriormente no formato `.json` para continuar a edição.
    *   **Limpar Tudo / Resetar**: Reseta todas as configurações de volta para o padrão original da Rakta.
*   **Configuração de Slides**: Ative ou desative individualmente os slides que constarão no PDF final (*Capa, Diagnóstico, Depoimentos, Portfólio Web, Portfólio Social, Metodologia, Solução, Investimento, Fechamento*).

### ✍️ 2. Aba de Contrato (MSA)
*   **Dados da Contratante**: Formulário completo para inclusão das informações jurídicas da empresa contratante:
    *   Razão Social (preenchida automaticamente com o nome do cliente da proposta caso esteja em branco).
    *   CNPJ (com máscara de formatação automática em tempo real).
    *   Telefone e Endereço Completo.
    *   Nome e E-mail do Representante Legal.
*   **Condições Financeiras do MSA**:
    *   Data de início do contrato.
    *   Dia do vencimento e método de pagamento para mensalidades.
    *   Quantidade de parcelas e método de pagamento para setups/implementação.
*   **Cláusulas Dinâmicas**: Vinculação automática dos serviços selecionados na proposta diretamente na seção de escopo do contrato, mantendo integridade total entre a venda e o compromisso jurídico.

---

## 👁️ Visualização & Exportação Premium

### Painel de Preview (Direita)
*   **Modo Rolar**: Visualização vertical contínua das páginas da proposta comercial sobrepostas milimetricamente.
*   **Modo Slides (Apresentação)**: Exibe uma página de cada vez na tela, ativando controles de navegação anterior/próximo, indicador de slide ativo e atalhos no teclado (setas esquerda e direita).
*   **Tela Cheia**: Permite apresentar os slides da proposta diretamente do navegador, sem distrações.

### Geração de Arquivos
1.  **Exportação de Proposta (PDF)**:
    *   Ao clicar em **"Gerar Proposta em PDF"**, o script clona as páginas em um container off-screen, eliminando bugs visuais causados por rolagem ou escalas do preview.
    *   Converte elementos em alta definição de pixels em proporção 16:9 widescreen (`2560px x 1440px`), garantindo exportações nítidas com escala premium 2x.
    *   Substitui efeitos de desfoque (`backdrop-filter`) por gradients e opacidade equivalentes suportados nativamente pelo `html2canvas`, preservando a beleza da apresentação.
    *   Gera slides dinâmicos divididos de 3 em 3 serviços para o escopo, impedindo que o texto estoure o espaço das páginas de solução.
    *   Salva o arquivo com nomenclatura inteligente: `Proposta Rakta - [Nome do Cliente].pdf`.
2.  **Impressão do Contrato (MSA)**:
    *   Tanto no painel superior quanto no rodapé lateral, o botão **"Imprimir Contrato"** formata o documento em padrão A4 de impressão.
    *   Utiliza formatação CSS específica para quebras de página (`page-break`), tabelas de cabeçalho e rodapé fixos em todas as folhas e fontes em Arial para conformidade jurídica.
    *   Abre diretamente a caixa de diálogo de impressão do sistema operacional para salvar como PDF ou enviar à impressora física.

---

## 📁 Estrutura de Arquivos

*   [index.html](file:///c:/Users/Marcel/Documents/gerador_proposta_rakta/index.html): Estrutura HTML do painel e do visualizador.
*   [style.css](file:///c:/Users/Marcel/Documents/gerador_proposta_rakta/style.css): Estilização completa do painel, dos slides (16:9 widescreen) e do visual de impressão do contrato.
*   [app.js](file:///c:/Users/Marcel/Documents/gerador_proposta_rakta/app.js): Lógica de gerenciamento do estado, cálculo de preços, integração de API do Gemini e orquestração do PDF.
*   [contractTemplate.js](file:///c:/Users/Marcel/Documents/gerador_proposta_rakta/contractTemplate.js): Template estrutural do contrato de Prestação de Serviços (MSA) em formato de string HTML parametrizada.
*   `assets/`: Imagens de background em alta resolução para os slides widescreen e logotipo institucional da Rakta.
*   [package.json](file:///c:/Users/Marcel/Documents/gerador_proposta_rakta/package.json): Configurações de desenvolvimento e dependências do Vite.
