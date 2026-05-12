# Inventor de Melodias

Aplicação web interativa para compor melodias numa tabela estilo “sequenciador”: cada coluna é um instante no tempo, cada linha é uma nota (Dó, Ré, Mi, Fá, Sol, Lá, Si, Dó). Pinta as células, ouve os sons ao compor e reproduz a sequência completa com pausas e durações respeitadas.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![JavaScript](https://img.shields.io/badge/JavaScript-ES202+-F7DF1E?logo=javascript&logoColor=000)
![Create React App](https://img.shields.io/badge/Create%20React%20App-5.0-09D3AC?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

---

## Preview

Tela principal 

<img width="2069" height="887" alt="Captura de tela 2026-05-12 201037" src="https://github.com/user-attachments/assets/70124e3c-da29-433e-8810-cc261c0162ee" />


Tabela com composição

<img width="2105" height="806" alt="Captura de tela 2026-05-12 201106" src="https://github.com/user-attachments/assets/714de915-f710-40f8-ad9e-80603bf049d7" />

---

## Funcionalidades

- **Tabela musical** — 8 linhas (uma oitava: Dó–Si–Dó) × 32 colunas; marca o ritmo ao longo do tempo.
- **Dois timbres** — Clique esquerdo (“nota preta”) e clique direito (“nota verde”); só uma nota ativa por coluna (as outras linhas da coluna são limpas ao pintar).
- **Som ao compor** — Cada célula preenchida dispara o áudio da respetiva nota, com pool de elementos `Audio` para sobreposições mais fluidas.
- **Notas prolongadas** — Blocos consecutivos da mesma cor na mesma linha prolongam a duração do som num único toque.
- **Pausas na reprodução** — Colunas vazias entre notas geram silêncio na reprodução, com destaque visual na linha de pausa.
- **Velocidade da sequência** — Seletor de 1× a 5× (ajusta ritmo e pausas da reprodução; o timbre dos ficheiros mantém-se natural).
- **Reproduzir e parar** — Reproduz a melodia da esquerda para a direita; durante a reprodução podes parar e limpar áudios agendados.
- **Limpar tabela** — Apaga toda a composição e o histórico de ações.
- **Edição rápida** — Duplo clique ou segundo clique direito rápido na mesma célula remove a nota.
- **Interface responsiva** — Layout adaptável; a tabela tem scroll horizontal em ecrãs estreitos.
- **Tipografia** — `Righteous` (títulos) e `Outfit` (corpo), via Tailwind.

---

## Notas e áudio

| Linha (grave → agudo) | Ficheiro (em `src/components/NotesTable/audios/`) |
|------------------------|---------------------------------------------------|
| Dó (grave) | `dó1.mp3` |
| Ré | `ré.mp3` |
| Mi | `mi.mp3` |
| Fá | `fá.mp3` |
| Sol | `sol.mp3` |
| Lá | `la.mp3` |
| Si | `si.mp3` |
| Dó (agudo) | `dó2.mp3` |

---

## Tecnologias

- **React 19** — Interface e estado da tabela.
- **Create React App** (`react-scripts`) — Arranque, build e testes.
- **Tailwind CSS 3** — Estilos utilitários e tema (`stage`, sombras, animações).
- **PostCSS / Autoprefixer** — Pipeline de CSS.
- **Jest + React Testing Library** — Testes (via CRA).
- **Web Vitals** — Métricas opcionais no arranque.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior recomendado.
- [npm](https://www.npmjs.com/) (incluído com Node).

---

## Instalação

```bash
git clone https://github.com/Andresa-Alves-Ribeiro/invente-melodia.git
cd invente-melodia
npm install
```

> Se o teu clone estiver noutra pasta (por exemplo `my-app`), entra nessa pasta antes de `npm install`.

---

## Executar o projeto

```bash
# Desenvolvimento (http://localhost:3000)
npm start

# Build de produção (saída em build/)
npm run build

# Servir o build localmente (requer um servidor estático; podes usar npx)
npx serve -s build
```

---

## Testes

```bash
# Modo interativo (watch)
npm test

# Uma execução + relatório de cobertura (CI / terminal)
npm test -- --coverage --watchAll=false
```

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Servidor de desenvolvimento com hot reload |
| `npm run build` | Gera o bundle otimizado para produção |
| `npm test` | Executa a suíte de testes (Jest) |
| `npm run eject` | Ejecta a configuração do CRA (irreversível; só se precisares de personalizar Webpack/Babel) |

---

## Estrutura do projeto

```
public/
├── index.html
├── manifest.json
└── robots.txt
src/
├── components/
│   └── NotesTable/
│       ├── NotesTable.jsx    # Lógica da tabela, áudio e reprodução
│       └── audios/           # MP3 por nota
├── App.jsx
├── App.test.js
├── index.css                 # Tailwind + estilos globais da app
├── index.js
├── reportWebVitals.js
└── setupTests.js
postcss.config.js
tailwind.config.js
package.json
```

---

## Como usar

1. **Pintar notas** — Clica com o botão esquerdo (nota preta) ou direito (nota verde) na célula desejada; só fica uma nota por coluna.
2. **Ouvir ao compor** — Cada clique toca a nota da linha correspondente.
3. **Apagar** — Duplo clique na célula ou dois cliques direitos rápidos na mesma célula.
4. **Velocidade** — Escolhe o nível no seletor **Velocidade** antes de **Reproduzir** (não é possível alterar durante a reprodução).
5. **Reproduzir** — **▶ Reproduzir** percorre as colunas com som e pausas; **⏹ Parar** interrompe.
6. **Limpar** — **Limpar tabela** remove todas as notas (e para a reprodução se estiver ativa).

---

## Licença

Projeto de uso pessoal / educacional.

---

## Autora

Olá! Sou **Andresa Alves Ribeiro**, desenvolvedora front-end / full-stack e estudante de Sistemas de Informação. Gosto de criar soluções para problemas complexos e de aprender tecnologias novas.

Este projeto foi desenvolvido como experiência em **React**, **JavaScript** e **Tailwind CSS**, com foco em interação, áudio no browser e uma experiência visual cuidada.

### Contacto

<p align="center">
  <a href="mailto:andresa_15ga@hotmail.com"><img src="https://img.shields.io/static/v1?logoWidth=15&logoColor=ff69b4&logo=gmail&label=Email&message=andresa_15ga@hotmail.com&color=ff69b4" alt="Email"></a>
  <a href="https://www.linkedin.com/in/andresa-alves-ribeiro/"><img alt="LinkedIn" src="https://img.shields.io/static/v1?logoWidth=15&logoColor=0A66C2&logo=LinkedIn&label=LinkedIn&message=andresa-alves-ribeiro&color=0A66C2"></a>
  <a href="https://www.instagram.com/dresa.alves/"><img alt="Instagram" src="https://img.shields.io/static/v1?logoWidth=15&logoColor=E4405F&logo=Instagram&label=Instagram&message=@dresa.alves&color=E4405F"></a>
</p>
