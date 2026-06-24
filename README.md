<div align="center">

<img src="./assets/icon.png" alt="Leitor de PDF" width="120" />

# Leitor de PDF

**Um leitor de PDF para Android — simples, rápido e open source.**

[![License: MIT](https://img.shields.io/badge/License-MIT-E53935.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android-3DDC84.svg)](https://www.android.com/)
[![Expo](https://img.shields.io/badge/Expo-54-000020.svg?logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg?logo=react)](https://reactnative.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-contribuição)

</div>

---

## 📖 Sobre

**Leitor de PDF** é uma aplicação móvel construída com **React Native** e **Expo** que permite explorar, abrir, pesquisar e ler documentos PDF diretamente no seu dispositivo Android. O foco é numa experiência limpa, rápida e totalmente offline para o dia a dia — sem anúncios, sem recolha de dados, 100% código aberto.

A aplicação abre-se também como visualizador padrão do sistema: ao tocar num ficheiro PDF noutra app (gestor de ficheiros, email, navegador), o Leitor de PDF surge na lista de aplicações para o abrir.

---

## ✨ Funcionalidades

- 📂 **Explorador de ficheiros completo** — navegação real por pastas com *breadcrumbs* tocáveis, botão de voltar por hardware e atalhos de **Acesso Rápido** (Downloads, Documentos, Imagens, Música, Vídeos, DCIM).
- 🔎 **Pesquisa recursiva** — encontre PDFs por nome dentro de qualquer pasta, com varrimento de subpastas.
- 📄 **Leitor de PDF nativo** — renderização fluida com `react-native-pdf`, navegação por páginas e suporte a links internos.
- ✍️ **Seleção e cópia de texto** — modo de texto baseado em `PDF.js` que sobrepõe uma camada selecionável sobre PDFs pesquisáveis, permitindo copiar texto real.
- ⭐ **Favoritos** — marque os documentos mais usados para acesso imediato.
- 🕑 **Recentes** — os últimos ficheiros abertos ficam sempre à mão no ecrã inicial.
- 🔗 **Integração com o sistema** — registado como visualizador de PDF (`file://` e `content://`) via *intent filters*.
- 🎨 **Interface limpa** — design coeso em tons de vermelho, navegação por abas e ícones consistentes.
- 🔌 **Offline-first** — funciona sem internet (o modo de seleção de texto carrega o PDF.js da CDN na primeira utilização).

---

## 📱 Capturas de Ecrã

> _Em breve._

| Início | Explorador | Leitor | Info |
|:------:|:----------:|:------:|:----:|
|   —    |     —      |   —    |  —   |

---

## 🛠️ Stack Tecnológica

| Categoria | Tecnologia |
|-----------|------------|
| Framework | [React Native](https://reactnative.dev/) `0.81` + [Expo](https://expo.dev/) `54` |
| Linguagem | JavaScript (React `19`) |
| Navegação | [React Navigation](https://reactnavigation.org/) (Stack + Bottom Tabs) |
| Renderização PDF | [`react-native-pdf`](https://github.com/wonday/react-native-pdf) |
| Seleção de texto | [`react-native-webview`](https://github.com/react-native-webview/react-native-webview) + [PDF.js](https://mozilla.github.io/pdf.js/) |
| Sistema de ficheiros | [`react-native-blob-util`](https://github.com/RonRadtke/react-native-blob-util) |
| Armazenamento local | [`@react-native-async-storage/async-storage`](https://github.com/react-native-async-storage/async-storage) |
| Ícones | [`lucide-react-native`](https://lucide.dev/) |
| Build | [EAS Build](https://docs.expo.dev/build/introduction/) |

---

## 🚀 Começar

### Pré-requisitos

- [Node.js](https://nodejs.org/) `18+`
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/) — `npm install -g expo`
- Um dispositivo/emulador Android (a app usa módulos nativos, **não** funciona no Expo Go padrão)

### Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/jorgeedvaldo/leitor-pdf.git
cd leitor-pdf

# 2. Instalar dependências
npm install

# 3. Gerar a build de desenvolvimento e correr no Android
npx expo run:android
```

### Compilar um APK (EAS Build)

```bash
# APK de pré-visualização (instalável diretamente)
eas build --profile preview --platform android

# Build de produção
eas build --profile production --platform android
```

---

## 📁 Estrutura do Projeto

```
leitor-pdf/
├── App.js                      # Entrada — permissões, deep links, splash
├── app.json                    # Configuração Expo (nome, ícones, permissões, intents)
├── eas.json                    # Perfis de build EAS
├── assets/                     # Ícones e logótipo da aplicação
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   └── logo.svg                # Logótipo vetorial fonte
└── src/
    ├── navigation/
    │   └── AppNavigator.js      # Navegação (Tabs + Stack)
    ├── screens/
    │   ├── HomeScreen.js        # Ecrã inicial com recentes e pesquisa
    │   ├── FileExplorerScreen.js# Explorador de pastas
    │   ├── PdfListScreen.js     # Listas (recentes/favoritos)
    │   ├── PdfViewerScreen.js   # Visualizador + modo de seleção de texto
    │   └── InfoScreen.js        # Sobre / créditos
    └── utils/
        ├── storage.js           # Persistência de recentes e favoritos
        └── theme.js             # Cores, espaçamentos, raios
```

---

## 🔐 Permissões

Em **Android 11+ (API 30+)** a aplicação requer a permissão **"Acesso a todos os ficheiros"** (`MANAGE_EXTERNAL_STORAGE`) para conseguir explorar livremente o armazenamento. A app encaminha o utilizador diretamente para o ecrã de definições correto.

Em versões anteriores é usada a permissão `READ_EXTERNAL_STORAGE`.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça *fork* do projeto
2. Crie uma *branch* para a sua funcionalidade (`git checkout -b feature/minha-feature`)
3. Faça *commit* das alterações (`git commit -m 'Adiciona minha feature'`)
4. Faça *push* para a *branch* (`git push origin feature/minha-feature`)
5. Abra um *Pull Request*

Encontrou um bug ou tem uma sugestão? [Abra uma issue](https://github.com/jorgeedvaldo/leitor-pdf/issues).

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o ficheiro [`LICENSE`](./LICENSE) para mais informações.

---

## 👤 Autor

Desenvolvido com ❤️ por **Edivaldo Jorge**.

[![GitHub](https://img.shields.io/badge/GitHub-jorgeedvaldo-181717?logo=github&logoColor=white)](https://github.com/jorgeedvaldo)
[![Instagram](https://img.shields.io/badge/Instagram-@jorgeedvaldo-E4405F?logo=instagram&logoColor=white)](https://instagram.com/jorgeedvaldo)
[![Email](https://img.shields.io/badge/Email-edivaldo.jorge@empregosyoyota.net-EA4335?logo=gmail&logoColor=white)](mailto:edivaldo.jorge@empregosyoyota.net)

---

<div align="center">

⭐ **Se gostou deste projeto, deixe uma estrela no repositório!**

</div>
