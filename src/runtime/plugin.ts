import { destr } from 'destr'
import { onError } from '@apollo/client/link/error'
import { getMainDefinition } from '@apollo/client/utilities'
import { createApolloProvider } from '@vue/apollo-option'
import { ApolloClients, provideApolloClients } from '@vue/apollo-composable'
import { ApolloClient, ApolloLink, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { setContext } from '@apollo/client/link/context'
import type { ClientConfig, ErrorResponse } from '../types'
import createRestartableClient from './ws'
import { useApollo } from './composables'
import { ref, useCookie, defineNuxtPlugin, useRequestHeaders } from '#imports'
import type { Ref } from '#imports'

import { NuxtApollo } from '#apollo'
import type { ApolloClientKeys } from '#apollo'

export default defineNuxtPlugin((nuxtApp) => {
  const requestCookies = (import.meta.server && NuxtApollo.proxyCookies && useRequestHeaders(['cookie'])) || undefined

  const clients = {} as Record<ApolloClientKeys, ApolloClient<unknown>>

  for (const [key, clientConfig] of Object.entries(NuxtApollo.clients) as [ApolloClientKeys, ClientConfig][]) {
    const getAuth = async () => {
      const token = ref<string | null>(null)

      await nuxtApp.callHook('apollo:auth', { token, client: key })

      if (!token.value) {
        if (clientConfig.tokenStorage === 'cookie') {
          if (import.meta.client) {
            const t = useCookie(clientConfig.tokenName!).value
            if (t) { token.value = t }
          } else if (requestCookies?.cookie) {
            const t = requestCookies.cookie.split(';').find(c => c.trim().startsWith(`${clientConfig.tokenName}=`))?.split('=')?.[1]
            if (t) { token.value = t }
          }
        } else if (import.meta.client && clientConfig.tokenStorage === 'localStorage') {
          token.value = localStorage.getItem(clientConfig.tokenName!)
        }

        if (!token.value) { return }
      }

      const authScheme = !!token.value?.match(/^[a-z]+\s/i)?.[0]

      if (authScheme || clientConfig?.authType === null) { return token.value }

      return `${clientConfig?.authType} ${token.value}`
    }

    const authLink = setContext(async (_, { headers }) => {
      const auth = await getAuth()

      if (!auth) { return }

      return {
        headers: {
          ...headers,
          ...(requestCookies && requestCookies),
          [clientConfig.authHeader!]: auth
        }
      }
    })

    const httpLink = authLink.concat(createHttpLink({
      ...(clientConfig?.httpLinkOptions && clientConfig.httpLinkOptions),
      uri: (import.meta.client && clientConfig.browserHttpEndpoint) || clientConfig.httpEndpoint,
      headers: { ...(clientConfig?.httpLinkOptions?.headers || {}) }
    }))

    let wsLink: GraphQLWsLink | null = null

    if (import.meta.client && clientConfig.wsEndpoint) {
      const wsClient = createRestartableClient({
        ...clientConfig.wsLinkOptions,
        url: clientConfig.wsEndpoint,
        connectionParams: async () => {
          const auth = await getAuth()

          if (!auth) { return }

          return { headers: { [clientConfig.authHeader!]: auth } }
        }
      })

      wsLink = new GraphQLWsLink(wsClient)

      nuxtApp._apolloWsClients = nuxtApp._apolloWsClients || {}

      // @ts-expect-error This is  a custom property we add, so TypeScript doesn't know about it
      nuxtApp._apolloWsClients[key] = wsClient
    }

    const errorLink = onError((err) => {
      nuxtApp.callHook('apollo:error', err)
    })

    const link = ApolloLink.from([
      errorLink,
      ...(!wsLink
        ? [httpLink]
        : [
            ...(clientConfig?.websocketsOnly
              ? [wsLink]
              : [
                  split(({ query }) => {
                    const definition = getMainDefinition(query)
                    return (definition.kind === 'OperationDefinition' && definition.operation === 'subscription')
                  },
                  wsLink,
                  httpLink)
                ])
          ])
    ])

    const cache = new InMemoryCache(clientConfig.inMemoryCacheOptions)

    clients[key as ApolloClientKeys] = new ApolloClient({
      link,
      cache,
      ...(NuxtApollo.clientAwareness && { name: key }),
      ...(import.meta.server
        ? { ssrMode: true }
        : { ssrForceFetchDelay: 100 }),
      connectToDevTools: clientConfig.connectToDevTools || false,
      defaultOptions: clientConfig?.defaultOptions
    })

    if (!clients?.default && !NuxtApollo?.clients?.default && key === Object.keys(NuxtApollo.clients)[0]) {
      clients.default = clients[key as ApolloClientKeys]
    }

    const cacheKey = `_apollo:${key}`

    nuxtApp.hook('app:rendered', () => {
      nuxtApp.payload.data[cacheKey] = cache.extract()
    })

    if (import.meta.client && nuxtApp.payload.data[cacheKey]) {
      cache.restore(destr(JSON.stringify(nuxtApp.payload.data[cacheKey])))
    }
  }

  provideApolloClients(clients)
  nuxtApp.vueApp.provide(ApolloClients, clients)
  nuxtApp.vueApp.use(createApolloProvider({ defaultClient: clients?.default }))
  nuxtApp._apolloClients = clients

  const defaultClient = clients?.default

  return {
    provide: {
      apolloHelpers: useApollo(),
      apollo: { clients, defaultClient }
    }
  }
})

export interface ModuleRuntimeHooks {
  'apollo:auth': (params: { client: ApolloClientKeys, token: Ref<string | null> }) => void
  'apollo:error': (error: ErrorResponse) => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DollarApolloHelpers extends ReturnType<typeof useApollo> {}
interface DollarApollo {
  clients: Record<ApolloClientKeys, ApolloClient<unknown>>
  defaultClient: ApolloClient<unknown>
}

declare module '#app' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RuntimeNuxtHooks extends ModuleRuntimeHooks {}
  interface NuxtApp {
    // @ts-expect-error When having the dist files also, TypeScript complains about this being declared twice
    $apolloHelpers: DollarApolloHelpers
    // @ts-expect-error When having the dist files also, TypeScript complains about this being declared twice
    $apollo: DollarApollo
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    // @ts-expect-error When having the dist files also, TypeScript complains about this being declared twice
    $apolloHelpers: DollarApolloHelpers
    // @ts-expect-error When having the dist files also, TypeScript complains about this being declared twice
    $apollo: DollarApollo
  }
}
