// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	modules: ['@nuxt/ui'],
	css: ['~/assets/css/main.css'],
	colorMode: {
		preference: 'light',
		fallback: 'light',
	},
	nitro: {
		alias: {
			'#prisma-client': fileURLToPath(new URL('./prisma/generated/client', import.meta.url))
		}
	},
	devServer: {
		port: 3000,
	},
	vite: {
		server: {
			allowedHosts: true,
		},
	},
	typescript: {
		tsConfig: {
			compilerOptions: {
				paths: {
					'#prisma-client': ['./prisma/generated/client']
				}
			}
		}
	}
})
