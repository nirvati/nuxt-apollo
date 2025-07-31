---
title: GraphQL integration for Nuxt
navigation: false
layout: page
seo:
  ogImage:
    url: /cover.jpg
---

::u-page-hero

#title
Nuxt [Apollo]{style="color: var(--color-primary-500)"}
#description
Leverage [Vue Apollo](https://v4.apollo.vuejs.org) to effortlessly integrate GraphQL into your Nuxt 3 projects.

#links
  :::u-button
  ---
  color: neutral
  size: xl
  to: /getting-started/quick-start
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  ::copy-code-input{source="npx nuxi@latest module add graphql"}
  ::

::u-page-section

#title
Everything you need for GraphQL in Nuxt



#features
  :::u-page-feature
  #title
  SSR Support

  #description
  Fully supports server-side rendering, giving you full control over where your GraphQL queries are executed.
  :::

  :::u-page-feature
  #title
  Minimal Configuration

  #description
  Configure your Apollo Client with just a few lines of code, making it easy to get started.
  :::
  
  :::u-page-feature
  #title
  Vue-Apollo Composables

  #description
  Use Vue Apollo's powerful composables to manage your GraphQL queries and mutations seamlessly.
  :::
  
  :::u-page-feature
  #title
  HMR for external Apollo Client configuration

  #description
  Enjoy hot module replacement for your Apollo Client configuration, allowing you to make changes without restarting your server.
  :::
