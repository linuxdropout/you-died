import App from './App'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

describe('client smoke test', () => {
  it('renders the app title', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('You Died')
  })
})
