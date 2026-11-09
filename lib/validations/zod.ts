import { z } from 'zod'

// Sans compilation à la volée (new Function) : la CSP interdit eval, et la simple tentative
// de zod pour le détecter serait signalée comme violation dans le navigateur.
z.config({ jitless: true })

export { z }
