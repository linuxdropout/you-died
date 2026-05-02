import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('client smoke test', () => {
  it('renders the app title', () => {
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('PREVIOUSLY ON:')
    expect(html).toContain('DIED')
  })
})
