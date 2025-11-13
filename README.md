# 🏆 Torneio de Truco - Encontro Agro-sol 2025

> Um sistema web para gerenciamento e exibição de um torneio de truco, projetado para ser exibido em um painel de LED durante o evento.

Este projeto foi criado para gerenciar de forma fácil e visual um torneio de truco, desde a importação de jogadores até a exibição do pódio final. Ele salva o progresso no navegador e inclui recursos visuais dinâmicos para exibição em eventos.



---

## ✨ Funcionalidades Principais

* **Upload de Participantes:** Carrega duplas ou jogadores individuais diretamente de uma planilha Excel (`.xlsx`).
* **Dois Modos de Jogo:**
    1.  **Duplas Prontas:** Aceita uma lista de duplas já formadas.
    2.  **Jogadores Individuais:** Sorteia automaticamente os jogadores em duplas.
* **Chaveamento Automático:** Gera o "bracket" do torneio (suporta 4, 8, 16, 32+ equipes) e adiciona "BYE" (Folga) automaticamente se o número de equipes não for uma potência de 2.
* **Gerenciamento de Partidas:** O administrador pode definir o vencedor de cada partida e **registrar o placar** (ex: "2x1").
* **Disputa de 3º Lugar:** Gera automaticamente a partida de disputa pelo terceiro lugar com os perdedores das semifinais.
* **Pódio Final:** Ao final, exibe uma tela de pódio com os 3 primeiros colocados, completa com efeitos sonoros e animação de confetes.
* **Download do Pódio:** Permite baixar uma imagem `.png` da tela do pódio para registro.
* **Persistência de Dados:** Salva todo o progresso do torneio no `localStorage` do navegador. Se você fechar a aba, o torneio continua de onde parou.

---

## 🎨 Modo Painel (Para Eventos)

O sistema foi pensado para ser exibido em um painel de LED. Para isso, ele conta com duas funcionalidades automáticas para manter o visual dinâmico:

* **Troca Automática de Tema:** A cada 60 segundos, o layout muda automaticamente entre 5 paletas de cores diferentes.
* **Auto-Scroll Ocioso:** Se o chaveamento for maior que a tela (exigindo rolagem) e o sistema ficar ocioso (sem uso do mouse) por 15 segundos, ele começará a rolar o chaveamento horizontalmente, permitindo que o público veja todas as chaves.

---

## 🚀 Como Utilizar

1.  **Abra o Site:** Basta abrir o arquivo `index.html` em qualquer navegador (ou acessar o link publicado no Netlify).
2.  **Carregue a Planilha:** Na tela inicial, arraste sua planilha Excel com os nomes dos jogadores/duplas na Coluna A.
3.  **Escolha o Modo:** Selecione "Duplas Prontas" ou "Jogadores Individuais".
4.  **Gere as Chaves:** Clique em "Sortear e Gerar Chaves".
5.  **Gerencie as Partidas:** Conforme os jogos acontecem, o administrador deve clicar no botão "Vencedor" da dupla correspondente e inserir o placar no `prompt` que aparecerá.
6.  **Navegue:** Ao final, o sistema mostrará o pódio. O administrador pode navegar livremente entre o Pódio e o Chaveamento final usando os botões "Ver Chaveamento" e "Ver Pódio".

---

## 💻 Tecnologias Utilizadas

* **HTML5**
* **CSS3** (com Variáveis CSS para os temas)
* **JavaScript (ES6+)**
* **[SheetJS (xlsx.js)](https://github.com/SheetJS/sheetjs):** Para ler os arquivos `.xlsx`.
* **[canvas-confetti](https://github.com/catdad/canvas-confetti):** Para a animação de confetes no pódio.
* **[html2canvas](https://github.com/niklasvh/html2canvas):** Para a funcionalidade de download do pódio.
