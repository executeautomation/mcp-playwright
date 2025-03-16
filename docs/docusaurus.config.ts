import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Playwright MCP Server',
  tagline: 'Fastest way to test your APIs and UI in Playwright with AI 🤖',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://executeautomation.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/mcp-playwright/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'executeautomation', // Usually your GitHub org/user name.
  projectName: 'mcp-playwright', // Usually your repo name.

  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  trailingSlash: false,
  deploymentBranch: 'gh-pages',
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/EA-Icon.svg',
    navbar: {
      title: 'Playwright MCP Server',
      logo: {
        alt: 'Playwright MCP Server',
        src: 'img/EA-Icon.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Tutorial',
        },
        {
          href: 'https://github.com/executeautomation/mcp-playwright',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
            {
              label: 'Playwright MCP for UI',
              href: 'https://youtu.be/8CcgFUE16HM',
            },
            {
              label: 'Playwright MCP for API',
              href: 'https://youtu.be/BYYyoRxCcFE',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Youtube',
              href: 'https://youtube.com/executeautomation',
            },
            {
              label: 'Udemy',
              href: 'https://www.udemy.com/user/karthik-kk',
            },
            {
              label: 'X',
              href: 'http://x.com/ExecuteAuto',
            },
          ],
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ExecuteAutomation Pvt Ltd.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
