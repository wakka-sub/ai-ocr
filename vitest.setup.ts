import { expect, afterEach } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { Image } from 'canvas'

expect.extend(matchers)
afterEach(cleanup)
;(globalThis as unknown as { Image: typeof Image }).Image = Image
